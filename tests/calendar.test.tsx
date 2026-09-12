// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AvailabilityCalendar } from '../components/availability-calendar';
import { tomorrowKigali, kigaliToday } from '../lib/dates';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const tomorrow = tomorrowKigali();
function button(date: string) {
  return screen.getByRole('button', { name: new RegExp(`^${date},`) });
}
describe('public calendar UI', () => {
  it('disables today and past dates and enables tomorrow after database response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ minimum: tomorrow, unavailable: [] }),
      }),
    );
    const onChange = vi.fn();
    render(<AvailabilityCalendar value="" onChange={onChange} />);
    await waitFor(() => expect((button(tomorrow) as HTMLButtonElement).disabled).toBe(false));
    const today = kigaliToday();
    if (today.slice(0, 7) === tomorrow.slice(0, 7))
      expect((button(today) as HTMLButtonElement).disabled).toBe(true);
    for (const el of screen.getAllByRole('button')) {
      const label = el.getAttribute('aria-label') || '';
      if (/^\d{4}-/.test(label) && label.slice(0, 10) < tomorrow)
        expect((el as HTMLButtonElement).disabled).toBe(true);
    }
    fireEvent.click(button(tomorrow));
    expect(onChange).toHaveBeenCalledWith(tomorrow);
    expect(screen.queryByRole('textbox')).toBeNull();
  });
  it('disables booked or blocked dates returned by the database', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ minimum: tomorrow, unavailable: [tomorrow] }),
      }),
    );
    const onChange = vi.fn();
    render(<AvailabilityCalendar value="" onChange={onChange} />);
    await waitFor(() => expect(screen.queryByText('Checking availability')).toBeNull());
    expect((button(tomorrow) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button(tomorrow));
    expect(onChange).not.toHaveBeenCalled();
  });
  it('fails closed during network failure and provides retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network unavailable')));
    render(<AvailabilityCalendar value="" onChange={() => {}} />);
    await screen.findByRole('alert');
    expect((button(tomorrow) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDefined();
  });
  it('does not enable dates before the database responds', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => new Promise(() => {})),
    );
    render(<AvailabilityCalendar value="" onChange={() => {}} />);
    expect((button(tomorrow) as HTMLButtonElement).disabled).toBe(true);
  });
});
