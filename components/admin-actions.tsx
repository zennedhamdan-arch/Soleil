'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LoaderCircle } from 'lucide-react';
import { Button } from './ui/button';
export async function adminRequest(payload: unknown) {
  const response = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not save changes.');
  return data;
}
export function ConfirmAction({
  label,
  message,
  payload,
  success,
  destructive = false,
}: {
  label: string;
  message: string;
  payload: unknown;
  success: string;
  destructive?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant={destructive ? 'outline' : 'secondary'}
        size="sm"
        onClick={() => dialog.current?.showModal()}
      >
        {label}
      </Button>
      <dialog
        ref={dialog}
        className="m-auto max-w-[440px] w-[calc(100%-32px)] rounded-lg border border-[#dce3d3] p-7 bg-[#fffefa] text-[#294738] backdrop:bg-[#10291da0]"
      >
        <h3 className="serif mb-4">{label}?</h3>
        <p className="text-sm">{message}</p>
        <div className="flex justify-end gap-3 mt-7">
          <Button variant="ghost" disabled={busy} onClick={() => dialog.current?.close()}>
            Go Back
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await adminRequest(payload);
                toast.success(success);
                dialog.current?.close();
                router.refresh();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Request failed.');
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? <LoaderCircle size={14} className="animate-spin" /> : label}
          </Button>
        </div>
      </dialog>
    </>
  );
}
export function NotesForm({ id, notes }: { id: string; notes: string }) {
  const [value, setValue] = useState(notes),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await adminRequest({ action: 'booking.notes', id, admin_notes: value });
          toast.success('Admin note saved');
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Could not save note.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-field">
        <label htmlFor="admin_notes">Private admin notes</label>
        <textarea
          id="admin_notes"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={10000}
          placeholder="Add context for your team…"
        />
      </div>
      <Button type="submit" disabled={busy} size="sm">
        {busy ? 'Saving…' : 'Save Note'}
      </Button>
    </form>
  );
}
