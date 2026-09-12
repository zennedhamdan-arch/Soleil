import Link from 'next/link';
import { Clock, CheckCircle2, XCircle, MinusCircle, Lock, ArrowUpRight } from 'lucide-react';
import type { Booking } from '@/lib/types';
import { prettyDate } from '@/lib/utils';
export function StatusBadge({ status }: { status: string }) {
  const Icon =
    {
      pending: Clock,
      approved: CheckCircle2,
      rejected: XCircle,
      cancelled: MinusCircle,
      blocked: Lock,
    }[status] || Clock;
  return (
    <span className={`badge ${status}`}>
      <Icon size={10} />
      {status}
    </span>
  );
}
export function AdminTitle({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="admin-title">
      <div>
        <div className="eyebrow" style={{ fontSize: 8, marginBottom: 10 }}>
          Soleil Garden · Venue management
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function BookingTable({
  bookings,
  compact = false,
}: {
  bookings: Booking[];
  compact?: boolean;
}) {
  if (!bookings.length)
    return (
      <div className="empty">
        <h3 className="serif">No enquiries here yet.</h3>
        <p>New event enquiries will appear here. Try a different filter or create a booking.</p>
      </div>
    );
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {[
              'Reference',
              'Customer',
              'Event',
              'Date',
              ...(!compact ? ['Guests'] : []),
              'Status',
              ...(!compact ? ['Created'] : []),
              'Actions',
            ].map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>
                <Link href={`/admin/bookings/${b.id}`}>{b.reference_number}</Link>
              </td>
              <td className="customer">
                {b.customer_name}
                <small>{b.phone}</small>
              </td>
              <td>{b.event_type.replaceAll('-', ' ')}</td>
              <td>{prettyDate(b.event_date)}</td>
              {!compact && <td>{b.guest_count}</td>}
              <td>
                <StatusBadge status={b.status} />
              </td>
              {!compact && <td>{prettyDate(b.created_at)}</td>}
              <td>
                <Link
                  href={`/admin/bookings/${b.id}`}
                  className="inline-flex gap-1 items-center"
                  aria-label={`View ${b.reference_number}`}
                >
                  View <ArrowUpRight size={12} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
