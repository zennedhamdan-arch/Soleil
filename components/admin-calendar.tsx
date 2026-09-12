'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Booking, BlockedDate } from '@/lib/types';
import { tomorrowKigali } from '@/lib/dates';
import { prettyDate } from '@/lib/utils';
import { StatusBadge } from './admin-ui';
import { Button } from './ui/button';
import { ConfirmAction } from './admin-actions';
export function AdminCalendar({
  month,
  bookings,
  blocks,
}: {
  month: string;
  bookings: Booking[];
  blocks: BlockedDate[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(''),
    [view, setView] = useState<'month' | 'week'>('month'),
    [week, setWeek] = useState(0);
  const y = Number(month.slice(0, 4)),
    m = Number(month.slice(5));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate(),
    offset = (new Date(`${month}-01T12:00:00Z`).getUTCDay() + 6) % 7;
  const allDays = Array.from(
    { length: Math.ceil((days + offset) / 7) * 7 },
    (_, i) => i - offset + 1,
  );
  const dates = view === 'week' ? allDays.slice(week * 7, week * 7 + 7) : allDays;
  const dayBookings = bookings.filter((b) => b.event_date === selected);
  const block = blocks.find((b) => b.date === selected);
  const approved = dayBookings.some((b) => b.status === 'approved');
  const canBlock = selected >= tomorrowKigali() && !block && !approved;
  function move(delta: number) {
    if (view === 'week' && week + delta >= 0 && week + delta < allDays.length / 7) {
      setWeek(week + delta);
      return;
    }
    const d = new Date(`${month}-15T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + delta);
    setSelected('');
    setWeek(0);
    router.push(`/admin/calendar?month=${d.toISOString().slice(0, 7)}`);
  }
  return (
    <>
      <div className="admin-panel">
        <div className="calendar-header">
          <h2>
            {new Intl.DateTimeFormat('en-GB', {
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
            }).format(new Date(`${month}-15T12:00:00Z`))}
          </h2>
          <div className="flex items-center gap-2">
            <div className="filter-tabs">
              <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>
                Month
              </button>
              <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>
                Week
              </button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous period"
              onClick={() => move(-1)}
            >
              <ChevronLeft size={17} />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Next period" onClick={() => move(1)}>
              <ChevronRight size={17} />
            </Button>
          </div>
        </div>
        <div className="calendar-grid">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="calendar-weekday">
              {d}
            </div>
          ))}
        </div>
        <div className="month-grid">
          {dates.map((day, i) => {
            if (day < 1 || day > days)
              return <div className="month-cell bg-[#f5f7f1]" key={`empty${i}`} />;
            const date = `${month}-${String(day).padStart(2, '0')}`,
              events = bookings.filter((b) => b.event_date === date),
              blocked = blocks.some((b) => b.date === date);
            return (
              <button
                key={date}
                onClick={() => setSelected(date)}
                aria-label={`${prettyDate(date)}, ${events.length} enquiries${blocked ? ', blocked' : ''}`}
                className={`month-cell ${selected === date ? 'selected' : ''}`}
              >
                <span>{day}</span>
                {blocked && <StatusBadge status="blocked" />}
                {events.slice(0, view === 'week' ? 10 : 2).map((b) => (
                  <StatusBadge key={b.id} status={b.status} />
                ))}
                {events.length > 2 && view === 'month' && (
                  <span className="text-[9px]">+{events.length - 2} more</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-5">
          {['approved', 'pending', 'blocked'].map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </div>
      <div className="admin-panel">
        <h2 className="mb-5">
          {selected ? prettyDate(selected) : 'Select a date to see its details'}
        </h2>
        {selected ? (
          <>
            <p className="text-xs mb-5">
              {block
                ? `Blocked: ${block.reason}`
                : approved
                  ? 'Unavailable — approved booking'
                  : selected < tomorrowKigali()
                    ? 'Closed to new enquiries — today or past date'
                    : 'Available for enquiries'}
              {!approved && dayBookings.length > 0
                ? ' · Pending enquiries do not reserve this date.'
                : ''}
            </p>
            {dayBookings.map((b) => (
              <Link href={`/admin/bookings/${b.id}`} key={b.id} className="summary-row">
                <span>
                  {b.reference_number} · {b.customer_name}
                </span>
                <StatusBadge status={b.status} />
              </Link>
            ))}
            <div className="flex flex-wrap gap-3 mt-5">
              {canBlock && (
                <ConfirmAction
                  label="Block Date"
                  message="Make this date unavailable for new enquiries? Pending enquiries will remain for review."
                  payload={{ action: 'block.create', date: selected, reason: 'Venue unavailable' }}
                  success="Date blocked"
                />
              )}
              {block && (
                <ConfirmAction
                  label="Unblock Date"
                  message="Remove this date block?"
                  payload={{ action: 'block.delete', id: block.id }}
                  success="Date unblocked"
                />
              )}
              {canBlock && (
                <Button asChild size="sm">
                  <Link href={`/admin/bookings/new?date=${selected}`}>
                    <Plus size={13} />
                    Create Booking
                  </Link>
                </Button>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs">
            See enquiries, review availability, and manage date blocks from one place.
          </p>
        )}
      </div>
    </>
  );
}
