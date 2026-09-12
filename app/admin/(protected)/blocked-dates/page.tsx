import { requireAdmin, assertQuery } from '@/lib/admin-data';
import { tomorrowKigali } from '@/lib/dates';
import { AdminTitle, StatusBadge } from '@/components/admin-ui';
import { ConfirmAction } from '@/components/admin-actions';
import { BlockForm } from '@/components/block-form';
import { prettyDate } from '@/lib/utils';
export default async function BlockedDates() {
  const { db } = await requireAdmin();
  const { data, error } = await db
    .from('blocked_dates')
    .select('*')
    .gte('date', tomorrowKigali())
    .order('date')
    .limit(366);
  assertQuery(error);
  return (
    <>
      <AdminTitle
        title="Blocked dates"
        description="Keep unavailable dates off the public enquiry calendar."
      />
      <div className="admin-grid">
        <div className="admin-panel">
          <h2 className="mb-6">Upcoming blocks</h2>
          {data?.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d) => (
                    <tr key={d.id}>
                      <td>{prettyDate(d.date)}</td>
                      <td>{d.reason}</td>
                      <td>
                        <StatusBadge status="blocked" />
                      </td>
                      <td>
                        <ConfirmAction
                          label="Unblock"
                          message={`Make ${prettyDate(d.date)} available for enquiries again?`}
                          payload={{ action: 'block.delete', id: d.id }}
                          success="Date unblocked"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">No upcoming blocked dates.</div>
          )}
          <p className="text-[10px] mt-4">
            Showing up to 366 upcoming blocks. All blocks are also accessible in Calendar.
          </p>
        </div>
        <div className="admin-panel">
          <h2 className="mb-6">Block a date</h2>
          <BlockForm />
        </div>
      </div>
    </>
  );
}
