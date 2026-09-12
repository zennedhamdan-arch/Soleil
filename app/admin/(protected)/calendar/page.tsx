import { requireAdmin, assertQuery } from '@/lib/admin-data';
import { kigaliToday } from '@/lib/dates';
import { AdminTitle } from '@/components/admin-ui';
import { AdminCalendar } from '@/components/admin-calendar';
export default async function Calendar({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const p = await searchParams;
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(p.month || '')
    ? p.month!
    : kigaliToday().slice(0, 7);
  const end = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)).getUTCDate();
  const { db } = await requireAdmin();
  const [b, d] = await Promise.all([
    db
      .from('bookings')
      .select('*')
      .in('status', ['approved', 'pending'])
      .gte('event_date', `${month}-01`)
      .lte('event_date', `${month}-${end}`)
      .order('created_at')
      .limit(1000),
    db.from('blocked_dates').select('*').gte('date', `${month}-01`).lte('date', `${month}-${end}`),
  ]);
  assertQuery(b.error);
  assertQuery(d.error);
  return (
    <>
      <AdminTitle
        title="Venue calendar"
        description="A clear view of your garden’s dates. All dates use Africa/Kigali time."
      />
      {b.data?.length === 1000 && (
        <div className="notice mb-4">
          This month contains many enquiries. The first 1,000 are shown; use Bookings to find
          additional records.
        </div>
      )}
      <AdminCalendar month={month} bookings={b.data || []} blocks={d.data || []} />
    </>
  );
}
