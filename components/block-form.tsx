'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AvailabilityCalendar } from './availability-calendar';
import { adminRequest } from './admin-actions';
import { Button } from './ui/button';
export function BlockForm({ initialDate = '' }: { initialDate?: string }) {
  const [date, setDate] = useState(initialDate),
    [reason, setReason] = useState('Private event'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
          await adminRequest({ action: 'block.create', date, reason });
          toast.success('Date blocked');
          router.refresh();
          setDate('');
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not block date.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <AvailabilityCalendar value={date} onChange={setDate} />
      <div className="form-field mt-6">
        <label htmlFor="reason">Reason for blocking</label>
        <select id="reason" value={reason} onChange={(e) => setReason(e.target.value)}>
          {['Private event', 'Maintenance', 'Venue unavailable', 'Holiday', 'Other'].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      {date && (
        <p className="text-xs mb-4">
          Selected date: <strong>{date}</strong>
        </p>
      )}
      {error && (
        <div role="alert" className="notice error-notice mb-4">
          {error}
        </div>
      )}
      <Button disabled={busy || !date} type="submit">
        {busy ? 'Blocking…' : 'Block Date'}
      </Button>
    </form>
  );
}
