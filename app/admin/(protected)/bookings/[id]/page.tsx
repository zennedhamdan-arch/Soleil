import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin, assertQuery } from '@/lib/admin-data';
import { AdminTitle, StatusBadge } from '@/components/admin-ui';
import { AdminBookingForm } from '@/components/admin-booking-form';
import { NotesForm, ConfirmAction } from '@/components/admin-actions';
import { Button } from '@/components/ui/button';
import { prettyDate } from '@/lib/utils';
export default async function BookingDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; date?: string }>;
}) {
  const [{ id }, p, { db }] = await Promise.all([params, searchParams, requireAdmin()]);
  if (id === 'new') {
    const { data, error } = await db.from('services').select('*').eq('active', true).order('name');
    assertQuery(error);
    return (
      <>
        <AdminTitle
          title="Create a booking"
          description="Add an event directly to your venue workspace."
        />
        <AdminBookingForm services={data || []} initialDate={p.date || ''} />
      </>
    );
  }
  if (!z.uuid().safeParse(id).success) notFound();
  const { data: b, error } = await db.from('bookings').select('*').eq('id', id).maybeSingle();
  assertQuery(error);
  if (!b) notFound();
  if (p.edit === 'true') {
    const { data, error } = await db.from('services').select('*').order('name');
    assertQuery(error);
    return (
      <>
        <AdminTitle title="Edit booking" description={b.reference_number} />
        <AdminBookingForm booking={b} services={data || []} />
      </>
    );
  }
  return (
    <>
      <AdminTitle title={b.reference_number} description="Booking details and team workspace.">
        <Button asChild variant="outline">
          <Link href={`/admin/bookings/${id}?edit=true`}>Edit Booking</Link>
        </Button>
      </AdminTitle>
      <div className="admin-grid">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Event enquiry</h2>
            <StatusBadge status={b.status} />
          </div>
          <dl className="detail-list">
            {[
              ['Customer', b.customer_name],
              ['Event type', b.event_type.replaceAll('-', ' ')],
              ['Event date', prettyDate(b.event_date)],
              ['Guest count', String(b.guest_count)],
              ['Phone', b.phone],
              ['Email', b.email || 'Not provided'],
              [
                'Created',
                new Intl.DateTimeFormat('en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'Africa/Kigali',
                }).format(new Date(b.created_at)),
              ],
              ['Reference', b.reference_number],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <hr className="my-6 border-[#e2e8d9]" />
          <div>
            <p className="text-xs mb-3">Customer message</p>
            <div className="detail-message text-sm">{b.message || 'No additional message.'}</div>
          </div>
          <div className="flex flex-wrap gap-2 mt-7">
            {b.status !== 'approved' && (
              <ConfirmAction
                label="Approve"
                message="Approve this booking and reserve the entire date? The database will check availability before approving."
                payload={{ action: 'booking.status', id, status: 'approved' }}
                success="Booking approved"
              />
            )}
            {b.status !== 'rejected' && (
              <ConfirmAction
                label="Reject"
                message="Reject this enquiry? If approved, its date will be released."
                payload={{ action: 'booking.status', id, status: 'rejected' }}
                success="Booking rejected"
                destructive
              />
            )}
            {b.status !== 'cancelled' && (
              <ConfirmAction
                label="Cancel Booking"
                message="Cancel this booking and release its approved date? Any separate admin block remains in place."
                payload={{ action: 'booking.status', id, status: 'cancelled' }}
                success="Booking cancelled"
                destructive
              />
            )}
          </div>
        </div>
        <div>
          <div className="admin-panel">
            <NotesForm id={id} notes={b.admin_notes} />
          </div>
          <div className="notice">
            Status changes are recorded in the database. Contact the customer directly to
            communicate your decision.
          </div>
        </div>
      </div>
      <Link href="/admin/bookings" className="text-xs">
        ← Back to bookings
      </Link>
    </>
  );
}
