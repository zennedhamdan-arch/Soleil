begin;
create extension if not exists pgcrypto;
create type public.booking_status as enum ('pending','approved','rejected','cancelled');
create type public.admin_role as enum ('admin','manager');
create table public.admin_profiles(id uuid primary key default gen_random_uuid(),user_id uuid not null unique references auth.users(id) on delete cascade,name text not null,role public.admin_role not null default 'manager',created_at timestamptz not null default now());
create function public.is_staff() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from admin_profiles where user_id=auth.uid()); $$;
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from admin_profiles where user_id=auth.uid() and role='admin'); $$;
create table public.services(id uuid primary key default gen_random_uuid(),name text not null,slug text not null unique,description text not null,image_url text not null default '',active boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create sequence public.booking_reference_seq;
create function public.new_booking_reference() returns text language plpgsql set search_path=public as $$ declare n text; begin n=nextval('public.booking_reference_seq')::text; return 'SG-'||to_char(now() at time zone 'Africa/Kigali','YYYYMMDD')||'-'||lpad(n,greatest(3,length(n)),'0'); end; $$;
create table public.bookings(
 id uuid primary key default gen_random_uuid(),reference_number text not null unique default public.new_booking_reference(),
 customer_name text not null check(length(customer_name) between 2 and 120),phone text not null check(length(phone) between 7 and 30),email text not null default '',event_type text not null references public.services(slug) on update cascade,event_date date not null,guest_count integer not null check(guest_count between 1 and 100000),message text not null default '' check(length(message)<=3000),status public.booking_status not null default 'pending',admin_notes text not null default '' check(length(admin_notes)<=10000),idempotency_key uuid unique,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index bookings_one_approved_date on public.bookings(event_date) where status='approved';
create index bookings_date_idx on public.bookings(event_date);
create index bookings_status_created_idx on public.bookings(status,created_at desc);
create table public.blocked_dates(id uuid primary key default gen_random_uuid(),date date not null unique,reason text not null check(length(reason) between 1 and 300),created_at timestamptz not null default now(),created_by uuid references auth.users(id) default auth.uid());
create table public.gallery(id uuid primary key default gen_random_uuid(),image_url text not null,title text not null,category text not null check(category in ('Weddings','Celebrations','Garden','Corporate','Other')),sort_order integer not null default 0,active boolean not null default true,created_at timestamptz not null default now());
create table public.site_settings(id integer primary key default 1 check(id=1),business_name text not null,phone text not null,whatsapp text not null,address text not null,description text not null,social_links jsonb not null default '{}',updated_at timestamptz not null default now());
create table public.request_limits(key text primary key,window_start timestamptz not null,hits integer not null);
create function public.touch_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end; $$;
create trigger services_updated before update on public.services for each row execute function public.touch_updated_at();
create trigger bookings_updated before update on public.bookings for each row execute function public.touch_updated_at();
create trigger settings_updated before update on public.site_settings for each row execute function public.touch_updated_at();
-- All booking/block writes serialize on a shared transaction lock. The unique partial
-- index is a second line of defence against two approvals on the same date.
create function public.guard_calendar() returns trigger language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(73645192);
 if TG_OP='DELETE' then return old; end if;
 if TG_TABLE_NAME='blocked_dates' then
  if new.date <= (now() at time zone 'Africa/Kigali')::date then raise exception 'INVALID_DATE'; end if;
  if exists(select 1 from bookings where event_date=new.date and status='approved') then raise exception 'DATE_UNAVAILABLE'; end if;
 else
  if TG_OP='INSERT' or new.event_date is distinct from old.event_date or (new.status='approved' and old.status<>'approved') then
   if new.event_date <= (now() at time zone 'Africa/Kigali')::date then raise exception 'INVALID_DATE'; end if;
   if exists(select 1 from blocked_dates where date=new.event_date) or exists(select 1 from bookings where event_date=new.event_date and status='approved' and id<>new.id) then raise exception 'DATE_UNAVAILABLE'; end if;
  end if;
 end if;
 return new;
end; $$;
create trigger bookings_calendar_guard before insert or update or delete on public.bookings for each row execute function public.guard_calendar();
create trigger blocks_calendar_guard before insert or update or delete on public.blocked_dates for each row execute function public.guard_calendar();
create function public.availability(start_date date,end_date date) returns table(date date) language plpgsql stable security definer set search_path=public as $$
begin
 if end_date<start_date or end_date-start_date>62 then raise exception 'INVALID_RANGE'; end if;
 return query select b.event_date from bookings b where b.status='approved' and b.event_date between start_date and end_date union select d.date from blocked_dates d where d.date between start_date and end_date;
end; $$;
-- Only the trusted server may invoke submission. No public INSERT or SELECT on bookings.
create function public.submit_enquiry(payload jsonb,request_key text) returns jsonb language plpgsql security definer set search_path=public as $$
declare existing bookings; result bookings; count_hits integer;
begin
 perform pg_advisory_xact_lock(73645192);
 select * into existing from bookings where idempotency_key=(payload->>'idempotency_key')::uuid;
 if found then return jsonb_build_object('reference_number',existing.reference_number); end if;
 insert into request_limits(key,window_start,hits) values(request_key,now(),1) on conflict(key) do update set hits=case when request_limits.window_start<now()-interval '1 hour' then 1 else request_limits.hits+1 end,window_start=case when request_limits.window_start<now()-interval '1 hour' then now() else request_limits.window_start end returning hits into count_hits;
 if count_hits>8 then raise exception 'RATE_LIMITED'; end if;
 if not exists(select 1 from services where slug=payload->>'event_type' and active) then raise exception 'INVALID_SERVICE'; end if;
 insert into bookings(customer_name,phone,email,event_type,event_date,guest_count,message,idempotency_key) values(payload->>'customer_name',payload->>'phone',coalesce(payload->>'email',''),payload->>'event_type',(payload->>'event_date')::date,(payload->>'guest_count')::integer,coalesce(payload->>'message',''),(payload->>'idempotency_key')::uuid) returning * into result;
 return jsonb_build_object('reference_number',result.reference_number);
end; $$;
revoke all on function public.submit_enquiry(jsonb,text) from public,anon,authenticated;
grant execute on function public.submit_enquiry(jsonb,text) to service_role;
revoke all on function public.availability(date,date) from public;
grant execute on function public.availability(date,date) to anon,authenticated;
alter table public.admin_profiles enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.gallery enable row level security;
alter table public.site_settings enable row level security;
alter table public.request_limits enable row level security;
create policy profile_self on public.admin_profiles for select to authenticated using(user_id=auth.uid());
create policy services_public on public.services for select to anon,authenticated using(active or public.is_staff());
create policy services_staff on public.services for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy gallery_public on public.gallery for select to anon,authenticated using(active or public.is_staff());
create policy gallery_staff on public.gallery for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy bookings_staff on public.bookings for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy blocks_staff on public.blocked_dates for all to authenticated using(public.is_staff()) with check(public.is_staff());
-- Settings contain only public business details, not credentials or admin configuration.
create policy settings_public on public.site_settings for select to anon,authenticated using(true);
create policy settings_admin on public.site_settings for update to authenticated using(public.is_admin()) with check(public.is_admin());
revoke all on public.bookings,public.blocked_dates,public.admin_profiles,public.request_limits from anon;
revoke all on public.request_limits from authenticated;
grant select,insert,update,delete on public.bookings,public.blocked_dates,public.services,public.gallery to authenticated;
grant select on public.services,public.gallery,public.site_settings to anon;
grant select,update on public.site_settings to authenticated;
grant select on public.admin_profiles to authenticated;
grant usage on sequence public.booking_reference_seq to authenticated;
insert into public.services(name,slug,description) values
('Wedding & Engagement','wedding-engagement','A garden setting for the beginning of your forever. Let’s talk about your wedding or engagement celebration.'),
('Corporate & Conference','corporate-conference','Bring your team, ideas and conversations together in a refreshing garden setting.'),
('Birthday','birthday','Mark another wonderful year with the people who make it special.'),
('Baby Shower','baby-shower','Gather your loved ones to celebrate a beautiful new beginning.'),
('Anniversary','anniversary','Celebrate your story and the moments you have shared.'),
('Children’s Party','childrens-party','Make space for little guests and big celebrations.'),
('Religious Event','religious-event','A welcoming setting for meaningful gatherings and shared faith.'),
('Religious Wedding','religious-wedding','Celebrate your commitment with a gathering that reflects your traditions.'),
('Retirement','retirement','Honour a remarkable chapter and toast to everything that comes next.'),
('School Event','school-event','Bring your school community together for a memorable occasion.'),
('Theme Party','theme-party','Share your vision and let’s start planning a celebration that feels like you.');
insert into public.site_settings(id,business_name,phone,whatsapp,address,description) values(1,'Soleil Garden','+250 790 009 264','+250790009264','Gikondo / KK35 Avenue, Kigali, Rwanda','A beautiful Kigali setting for weddings, celebrations, gatherings and unforgettable events.');
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('venue','venue',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy venue_public_read on storage.objects for select to anon,authenticated using(bucket_id='venue');
create policy venue_staff_insert on storage.objects for insert to authenticated with check(bucket_id='venue' and public.is_staff());
create policy venue_staff_update on storage.objects for update to authenticated using(bucket_id='venue' and public.is_staff()) with check(bucket_id='venue' and public.is_staff());
create policy venue_staff_delete on storage.objects for delete to authenticated using(bucket_id='venue' and public.is_staff());
-- A safe, public change signal for open calendars. No booking rows or personal
-- details are ever published to public Realtime subscribers.
create table public.availability_revision (
  id integer primary key check (id=1),
  revision bigint not null default 0
);
insert into public.availability_revision(id) values(1);
alter table public.availability_revision enable row level security;
create policy availability_revision_public on public.availability_revision
  for select to anon,authenticated using(true);
grant select on public.availability_revision to anon,authenticated;
revoke insert,update,delete on public.availability_revision from anon,authenticated;
create function public.notify_availability_change() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  update public.availability_revision set revision=revision+1 where id=1;
  return null;
end; $$;
create trigger bookings_availability_signal after insert or update or delete
  on public.bookings for each statement execute function public.notify_availability_change();
create trigger blocks_availability_signal after insert or update or delete
  on public.blocked_dates for each statement execute function public.notify_availability_change();
-- Hosted Supabase provides this publication. The conditional keeps the core
-- schema executable in standalone PostgreSQL test environments too.
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    alter publication supabase_realtime add table public.availability_revision;
  end if;
end; $$;
commit;
