'use client';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { tomorrowKigali } from '@/lib/dates';
import { Button } from './ui/button';
import { availabilityClient } from '@/lib/supabase/availability-client';
export function AvailabilityCalendar({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}) {
  const initial = value || tomorrowKigali();
  const [month, setMonth] = useState(initial.slice(0, 7));
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [minimum, setMinimum] = useState(tomorrowKigali());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const year = Number(month.slice(0, 4)),
    m = Number(month.slice(5));
  const days = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const offset = (new Date(`${month}-01T12:00:00Z`).getUTCDay() + 6) % 7;
  const load = useCallback(
    (signal: AbortSignal) => {
      setLoading(true);
      setError('');
      fetch(`/api/availability?start=${month}-01&end=${month}-${days}`, {
        signal,
        cache: 'no-store',
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          setUnavailable(data.unavailable);
          setMinimum(data.minimum);
        })
        .catch((e) => {
          if (e.name !== 'AbortError') setError(e.message || 'Unable to load availability.');
        })
        .finally(() => {
          if (!signal.aborted) setLoading(false);
        });
    },
    [month, days],
  );
  useEffect(() => {
    const controller = new AbortController();
    const initial = setTimeout(() => load(controller.signal), 0);
    const refresh = () => load(controller.signal);
    window.addEventListener('focus', refresh);
    const timer = setInterval(refresh, 60000);
    const client = availabilityClient();
    const channel = client
      ?.channel(`availability-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'availability_revision' },
        refresh,
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') refresh();
      });
    return () => {
      if (client && channel) void client.removeChannel(channel);
      controller.abort();
      clearTimeout(initial);
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [load, retry]);
  function move(delta: number) {
    setLoading(true);
    const d = new Date(`${month}-15T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + delta);
    setMonth(d.toISOString().slice(0, 7));
  }
  return (
    <div aria-label="Choose an available event date" aria-busy={loading}>
      <div className="calendar-header">
        <h3 style={{ fontSize: 20, margin: 0 }}>
          {new Intl.DateTimeFormat('en-GB', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          }).format(new Date(`${month}-15T12:00:00Z`))}
        </h3>
        <div className="flex gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Previous month"
            disabled={month <= minimum.slice(0, 7)}
            onClick={() => move(-1)}
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Next month"
            onClick={() => move(1)}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
      {error && (
        <div role="alert" className="notice error-notice mb-4">
          {error}
          <button type="button" className="underline ml-2" onClick={() => setRetry((x) => x + 1)}>
            Retry
          </button>
        </div>
      )}
      <div className="calendar-grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <span key={d} className="calendar-weekday">
            {d}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`blank${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, '0')}`;
          const disabled =
            loading ||
            !!error ||
            date < minimum ||
            date < tomorrowKigali() ||
            unavailable.includes(date);
          return (
            <button
              key={date}
              type="button"
              className={`calendar-day ${value === date ? 'selected' : ''}`}
              disabled={disabled}
              aria-pressed={value === date}
              aria-label={`${date}${disabled ? ', unavailable' : ', available'}`}
              onClick={() => onChange(date)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="calendar-legend">
        <span>
          <i className="legend-dot" />
          Available to enquire
        </span>
        <span>
          <i className="legend-dot unavailable" />
          Unavailable
        </span>
        {loading && (
          <span role="status">
            <LoaderCircle size={12} className="animate-spin" />
            Checking availability
          </span>
        )}
      </div>
      <p className="text-[10px] mt-3">
        Dates begin tomorrow in Africa/Kigali. Availability is checked again when you submit.
      </p>
      {value && (unavailable.includes(value) || value < minimum) && (
        <p role="alert" className="field-error mt-3">
          Your selected date is no longer available. Please choose another date.
        </p>
      )}
    </div>
  );
}
