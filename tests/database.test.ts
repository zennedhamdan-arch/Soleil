import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
let db: PGlite;
let tomorrow: string;
const staff = '11111111-1111-4111-8111-111111111111',
  manager = '22222222-2222-4222-8222-222222222222';
async function offset(days: number) {
  return (
    await db.query<{ date: string }>(
      `select to_char((now() at time zone 'Africa/Kigali')::date+$1::int,'YYYY-MM-DD') as date`,
      [days],
    )
  ).rows[0].date;
}
function payload(date: string, key = crypto.randomUUID()) {
  return {
    customer_name: 'Integration Test',
    phone: '+250790000000',
    email: '',
    event_type: 'birthday',
    event_date: date,
    guest_count: 20,
    message: 'Test enquiry',
    idempotency_key: key,
  };
}
async function submit(date: string, key = crypto.randomUUID(), ip = crypto.randomUUID()) {
  return (
    await db.query<{ result: { reference_number: string } }>(
      'select public.submit_enquiry($1::jsonb,$2) as result',
      [JSON.stringify(payload(date, key)), ip],
    )
  ).rows[0].result;
}
async function bookingId(ref: string) {
  return (
    await db.query<{ id: string }>('select id from bookings where reference_number=$1', [ref])
  ).rows[0].id;
}
beforeAll(async () => {
  db = new PGlite();
  // Supabase provides these auth/storage primitives. Only this bootstrap is mocked;
  // the migration, triggers, RPCs, constraints and RLS run in PostgreSQL itself.
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid; $$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text);alter table storage.objects enable row level security;grant usage on schema public,auth,storage to anon,authenticated,service_role;`,
  );
  const migration = readFileSync(
    new URL('../supabase/migrations/202609120001_initial.sql', import.meta.url),
    'utf8',
  ).replace('create extension if not exists pgcrypto;', '');
  await db.exec(migration);
  await db.exec(
    readFileSync(
      new URL('../supabase/migrations/202609120002_owner_photographs.sql', import.meta.url),
      'utf8',
    ),
  );
  tomorrow = await offset(1);
  await db.query('insert into auth.users(id) values($1),($2)', [staff, manager]);
  await db.query(
    `insert into admin_profiles(user_id,name,role) values($1,'Admin','admin'),($2,'Manager','manager')`,
    [staff, manager],
  );
}, 60000);
afterAll(async () => {
  await db?.close();
});
describe.sequential('PostgreSQL schema and booking invariants', () => {
  it('seeds all 11 services without invented venue claims', async () => {
    expect(
      (await db.query<{ count: number }>('select count(*)::int as count from services')).rows[0]
        .count,
    ).toBe(11);
  });
  it('seeds all eight owner photographs and service images without changing booking data', async () => {
    const images = (await db.query<{ image_url: string }>('select image_url from gallery')).rows;
    expect(images).toHaveLength(8);
    expect(images.every((image) => image.image_url.startsWith('/images/soleil/venue-'))).toBe(true);
    const services = (await db.query<{ image_url: string }>('select image_url from services')).rows;
    expect(services.every((service) => service.image_url.startsWith('/images/soleil/venue-'))).toBe(
      true,
    );
    expect((await db.query('select id from bookings')).rows).toHaveLength(0);
  });
  it('photo migration is idempotent and preserves staff changes', async () => {
    await db.query("update gallery set active=false where image_url='/images/soleil/venue-10.jpg'");
    await db.query(
      "update services set image_url='/images/soleil/venue-8.jpg' where slug='birthday'",
    );
    await db.exec(
      readFileSync(
        new URL('../supabase/migrations/202609120002_owner_photographs.sql', import.meta.url),
        'utf8',
      ),
    );
    expect((await db.query('select id from gallery')).rows).toHaveLength(8);
    expect(
      (
        await db.query<{ active: boolean }>(
          "select active from gallery where image_url='/images/soleil/venue-10.jpg'",
        )
      ).rows[0].active,
    ).toBe(false);
    expect(
      (
        await db.query<{ image_url: string }>(
          "select image_url from services where slug='birthday'",
        )
      ).rows[0].image_url,
    ).toBe('/images/soleil/venue-8.jpg');
  });
  it('submits a pending enquiry with a readable unique reference', async () => {
    const result = await submit(tomorrow);
    expect(result.reference_number).toMatch(/^SG-\d{8}-\d{3,}$/);
    const rows = await db.query<{ status: string }>(
      'select status from bookings where reference_number=$1',
      [result.reference_number],
    );
    expect(rows.rows[0].status).toBe('pending');
  });
  it('pending enquiries do not block a date', async () => {
    await submit(tomorrow);
    expect((await db.query('select * from availability($1,$1)', [tomorrow])).rows).toHaveLength(0);
  });
  it('rejects yesterday and today even when frontend is bypassed', async () => {
    await expect(submit(await offset(-1))).rejects.toThrow('INVALID_DATE');
    await expect(submit(await offset(0))).rejects.toThrow('INVALID_DATE');
  });
  it('returns the same reference for retries without creating duplicates', async () => {
    const key = crypto.randomUUID();
    const first = await submit(tomorrow, key),
      second = await submit(tomorrow, key);
    expect(second).toEqual(first);
    expect(
      (await db.query('select id from bookings where idempotency_key=$1', [key])).rows,
    ).toHaveLength(1);
  });
  it('approved bookings make dates unavailable and prevent new enquiries', async () => {
    const date = await offset(2),
      r = await submit(date);
    await db.query(`update bookings set status='approved' where reference_number=$1`, [
      r.reference_number,
    ]);
    expect((await db.query('select * from availability($1,$1)', [date])).rows).toHaveLength(1);
    await expect(submit(date)).rejects.toThrow('DATE_UNAVAILABLE');
  });
  it('prevents duplicate approvals among competing pending enquiries', async () => {
    const date = await offset(3),
      a = await submit(date),
      b = await submit(date);
    await db.query(`update bookings set status='approved' where reference_number=$1`, [
      a.reference_number,
    ]);
    await expect(
      db.query(`update bookings set status='approved' where reference_number=$1`, [
        b.reference_number,
      ]),
    ).rejects.toThrow('DATE_UNAVAILABLE');
  });
  it('blocks reject enquiries, and duplicate blocks are rejected', async () => {
    const date = await offset(4);
    await db.query(`insert into blocked_dates(date,reason) values($1,'Maintenance')`, [date]);
    await expect(submit(date)).rejects.toThrow('DATE_UNAVAILABLE');
    await expect(
      db.query(`insert into blocked_dates(date,reason) values($1,'Other')`, [date]),
    ).rejects.toThrow();
    expect((await db.query('select * from availability($1,$1)', [date])).rows).toHaveLength(1);
  });
  it('cannot block an approved date', async () => {
    await expect(
      db.query(`insert into blocked_dates(date,reason) values($1,'Other')`, [await offset(2)]),
    ).rejects.toThrow('DATE_UNAVAILABLE');
  });
  it('cannot approve a pending enquiry on a newly blocked date', async () => {
    const date = await offset(5),
      a = await submit(date);
    await db.query(`insert into blocked_dates(date,reason) values($1,'Other')`, [date]);
    await expect(
      db.query(`update bookings set status='approved' where reference_number=$1`, [
        a.reference_number,
      ]),
    ).rejects.toThrow('DATE_UNAVAILABLE');
  });
  it('unblocking restores enquiry availability', async () => {
    const date = await offset(4);
    await db.query('delete from blocked_dates where date=$1', [date]);
    expect((await db.query('select * from availability($1,$1)', [date])).rows).toHaveLength(0);
    await expect(submit(date)).resolves.toHaveProperty('reference_number');
  });
  it('rejection and cancellation release approved dates', async () => {
    for (const [delta, status] of [
      [6, 'rejected'],
      [7, 'cancelled'],
    ] as const) {
      const date = await offset(delta),
        a = await submit(date);
      await db.query(`update bookings set status='approved' where reference_number=$1`, [
        a.reference_number,
      ]);
      await db.query('update bookings set status=$1 where reference_number=$2', [
        status,
        a.reference_number,
      ]);
      expect((await db.query('select * from availability($1,$1)', [date])).rows).toHaveLength(0);
      await expect(submit(date)).resolves.toHaveProperty('reference_number');
    }
  });
  it('limits repeated successful enquiries by hashed source', async () => {
    const ip = crypto.randomUUID();
    for (let i = 0; i < 8; i++) await submit(tomorrow, crypto.randomUUID(), ip);
    await expect(submit(tomorrow, crypto.randomUUID(), ip)).rejects.toThrow('RATE_LIMITED');
  });
  it('rejects inactive services', async () => {
    await db.exec(`update services set active=false where slug='birthday'`);
    await expect(submit(tomorrow)).rejects.toThrow('INVALID_SERVICE');
    await db.exec(`update services set active=true where slug='birthday'`);
  });
  it('references remain unique after one million sequence values', async () => {
    await db.exec(`select setval('booking_reference_seq',999999)`);
    const a = await submit(tomorrow),
      b = await submit(tomorrow);
    expect(a.reference_number).toMatch(/-1000000$/);
    expect(b.reference_number).toMatch(/-1000001$/);
  });
  it('limits availability range and returns dates only', async () => {
    await expect(
      db.query('select * from availability($1,$2)', [tomorrow, await offset(100)]),
    ).rejects.toThrow('INVALID_RANGE');
    const result = await db.query<{ date: string }>('select * from availability($1,$2)', [
      tomorrow,
      await offset(30),
    ]);
    for (const row of result.rows) expect(Object.keys(row)).toEqual(['date']);
  });
  it('enables RLS on every application table', async () => {
    const rows = await db.query<{ relrowsecurity: boolean }>(
      `select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'`,
    );
    expect(rows.rows.length).toBe(8);
    expect(rows.rows.every((r) => r.relrowsecurity)).toBe(true);
  });
  it('anonymous users cannot read bookings, blocks, profiles or submit RPC directly', async () => {
    await db.exec('set role anon');
    try {
      for (const table of ['bookings', 'blocked_dates', 'admin_profiles', 'request_limits'])
        await expect(db.query(`select * from ${table}`)).rejects.toThrow('permission denied');
      await expect(submit(tomorrow)).rejects.toThrow('permission denied');
      expect((await db.query('select * from services')).rows).toHaveLength(11);
      await expect(
        db.query('select * from availability($1,$1)', [tomorrow]),
      ).resolves.toBeDefined();
    } finally {
      await db.exec('reset role');
    }
  });
  it('authenticated non-staff cannot read or change customer bookings', async () => {
    const b = await submit(tomorrow),
      id = await bookingId(b.reference_number);
    await db.exec('set role authenticated');
    try {
      expect((await db.query('select * from bookings')).rows).toHaveLength(0);
      expect(
        (await db.query(`update bookings set status='cancelled' where id=$1 returning id`, [id]))
          .rows,
      ).toHaveLength(0);
      await expect(
        db.query(`insert into blocked_dates(date,reason) values($1,'Forbidden')`, [
          await offset(20),
        ]),
      ).rejects.toThrow('row-level security');
    } finally {
      await db.exec('reset role');
    }
  });
  it('manager can manage bookings but not site settings or staff privileges', async () => {
    await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [manager]);
    await db.exec('set role authenticated');
    try {
      expect((await db.query('select * from bookings')).rows.length).toBeGreaterThan(0);
      expect(
        (await db.query(`update site_settings set business_name='Unauthorized' returning id`)).rows,
      ).toHaveLength(0);
      await expect(
        db.query(`update admin_profiles set role='admin' where user_id=$1`, [manager]),
      ).rejects.toThrow('permission denied');
    } finally {
      await db.exec('reset role');
      await db.exec(`select set_config('request.jwt.claim.sub','',false)`);
    }
  });
  it('publishes only an availability revision and denies public mutation', async () => {
    const before = (
      await db.query<{ revision: number }>('select revision from availability_revision where id=1')
    ).rows[0].revision;
    await submit(tomorrow);
    const after = (
      await db.query<{ revision: number }>('select revision from availability_revision where id=1')
    ).rows[0].revision;
    expect(Number(after)).toBeGreaterThan(Number(before));
    await db.exec('set role anon');
    try {
      const signal = await db.query<Record<string, unknown>>('select * from availability_revision');
      expect(Object.keys(signal.rows[0]).sort()).toEqual(['id', 'revision']);
      await expect(db.query('update availability_revision set revision=0')).rejects.toThrow(
        'permission denied',
      );
    } finally {
      await db.exec('reset role');
    }
  });
  it('administrator can update public settings', async () => {
    await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [staff]);
    await db.exec('set role authenticated');
    try {
      expect(
        (await db.query(`update site_settings set business_name='Soleil Garden' returning id`))
          .rows,
      ).toHaveLength(1);
    } finally {
      await db.exec('reset role');
      await db.exec(`select set_config('request.jwt.claim.sub','',false)`);
    }
  });
});
