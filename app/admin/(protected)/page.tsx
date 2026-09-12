import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  CalendarDays,
  CalendarOff,
  Plus,
  ArrowUpRight,
  Images,
  Flower2,
} from 'lucide-react';
import { requireAdmin, assertQuery } from '@/lib/admin-data';
import { kigaliToday } from '@/lib/dates';
import { AdminTitle, StatusBadge, BookingTable } from '@/components/admin-ui';
import { Button } from '@/components/ui/button';
import { prettyDate } from '@/lib/utils';
export default async function Dashboard() {
  const { db, profile } = await requireAdmin();
  const today = kigaliToday();
  const results = await Promise.all([
    db.from('bookings').select('*', { head: true, count: 'exact' }).eq('status', 'pending'),
    db.from('bookings').select('*', { head: true, count: 'exact' }).eq('status', 'approved'),
    db
      .from('bookings')
      .select('*', { head: true, count: 'exact' })
      .eq('status', 'approved')
      .gte('event_date', today),
    db.from('blocked_dates').select('*', { head: true, count: 'exact' }).gte('date', today),
    db
      .from('bookings')
      .select('*')
      .eq('status', 'approved')
      .gte('event_date', today)
      .order('event_date')
      .limit(5),
    db.from('bookings').select('*').order('created_at', { ascending: false }).limit(5),
  ]);
  results.forEach((r) => assertQuery(r.error));
  const metrics = [
    { label: 'Pending enquiries', icon: Clock, sub: 'Awaiting your review' },
    { label: 'Approved bookings', icon: CheckCircle2, sub: 'All approved reservations' },
    { label: 'Upcoming events', icon: CalendarDays, sub: 'Today and in the future' },
    { label: 'Blocked dates', icon: CalendarOff, sub: 'Current and upcoming' },
  ];
  return (
    <>
      <AdminTitle
        title={`Hello, ${profile.name.split(' ')[0]}.`}
        description="Here’s what’s happening at the garden."
      >
        <Button asChild>
          <Link href="/admin/bookings/new">
            <Plus size={15} />
            New Booking
          </Link>
        </Button>
      </AdminTitle>
      <div className="metric-grid">
        {metrics.map((m, i) => (
          <div className="metric" key={m.label}>
            <div className="metric-label">
              {m.label}
              <m.icon size={16} />
            </div>
            <div className="metric-value">{results[i].count ?? 0}</div>
            <small>{m.sub}</small>
          </div>
        ))}
      </div>
      <div className="quick-actions">
        <Button asChild variant="outline">
          <Link href="/admin/blocked-dates">
            <Plus size={14} />
            Block Date
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/gallery">
            <Images size={14} />
            Manage Gallery
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/services">
            <Flower2 size={14} />
            Manage Services
          </Link>
        </Button>
      </div>
      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2>Upcoming events</h2>
          <Link className="text-xs flex items-center gap-1" href="/admin/calendar">
            Open calendar <ArrowUpRight size={13} />
          </Link>
        </div>
        {results[4].data?.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event date</th>
                  <th>Event</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {results[4].data.map((b) => (
                  <tr key={b.id}>
                    <td>{prettyDate(b.event_date)}</td>
                    <td>{b.event_type.replaceAll('-', ' ')}</td>
                    <td>{b.customer_name}</td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td>
                      <Link href={`/admin/bookings/${b.id}`}>View ↗</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <CalendarDays size={25} className="mx-auto mb-3" />
            <p>No upcoming approved events. Approved bookings will appear here.</p>
          </div>
        )}
      </div>
      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2>Recent enquiries</h2>
          <Link className="text-xs flex items-center gap-1" href="/admin/bookings">
            All bookings <ArrowUpRight size={13} />
          </Link>
        </div>
        <BookingTable bookings={results[5].data || []} compact />
      </div>
      <p className="text-[10px]">
        Live records from your venue database. Pending enquiries do not reserve a date.
      </p>
    </>
  );
}
