import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { requireAdmin, assertQuery } from '@/lib/admin-data';
import { AdminTitle, BookingTable } from '@/components/admin-ui';
import { Button } from '@/components/ui/button';
const statuses = ['all', 'pending', 'approved', 'rejected', 'cancelled'];
export default async function Bookings({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const p = await searchParams;
  const status = statuses.includes(p.status || '') ? p.status! : 'all',
    search = (p.q || '').trim().slice(0, 100),
    page = Math.max(1, Math.min(10000, parseInt(p.page || '1') || 1));
  const { db } = await requireAdmin();
  let query = db
    .from('bookings')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * 20, page * 20 - 1);
  if (status !== 'all') query = query.eq('status', status);
  const safe = search.replace(/[^\p{L}\p{N} +\-]/gu, '');
  if (safe)
    query = query.or(
      `customer_name.ilike.%${safe}%,phone.ilike.%${safe}%,reference_number.ilike.%${safe}%`,
    );
  const { data, count, error } = await query;
  assertQuery(error);
  const link = (page: number) =>
    `/admin/bookings?${new URLSearchParams({ status, q: search, page: String(page) })}`;
  return (
    <>
      <AdminTitle
        title="Bookings & enquiries"
        description="Manage every occasion, from first hello to a confirmed date."
      >
        <Button asChild>
          <Link href="/admin/bookings/new">
            <Plus size={15} />
            New Booking
          </Link>
        </Button>
      </AdminTitle>
      <div className="admin-panel">
        <div className="filter-bar">
          <nav className="filter-tabs" aria-label="Booking status">
            {statuses.map((s) => (
              <Link
                key={s}
                className={`capitalize ${status === s ? 'active' : ''}`}
                href={`/admin/bookings?${new URLSearchParams({ status: s, q: search })}`}
              >
                {s}
              </Link>
            ))}
          </nav>
          <form className="search-box" action="/admin/bookings">
            <input type="hidden" name="status" value={status} />
            <Search size={15} />
            <input
              name="q"
              defaultValue={search}
              aria-label="Search customer, phone or reference"
              placeholder="Customer, phone or reference"
              maxLength={100}
            />
            <button type="submit" className="text-xs">
              Search
            </button>
          </form>
        </div>
        <BookingTable bookings={data || []} />
        <div className="pagination">
          <span>
            {count || 0} records · Page {page}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={link(page - 1)}>Previous</Link>
              </Button>
            )}
            {page * 20 < (count || 0) && (
              <Button asChild variant="outline" size="sm">
                <Link href={link(page + 1)}>Next</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
