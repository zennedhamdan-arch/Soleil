import { describe, it, expect, vi, afterEach } from 'vitest';
import { kigaliToday, tomorrowKigali, isFutureDate, isValidDate } from '../lib/dates';
import { bookingSchema, enquirySchema } from '../lib/validation';
describe('Africa/Kigali date restrictions', () => {
  const now = new Date('2026-09-12T10:00:00Z');
  it('uses the venue day, not the UTC day at midnight', () => {
    expect(kigaliToday(new Date('2026-09-12T22:01:00Z'))).toBe('2026-09-13');
    expect(tomorrowKigali(new Date('2026-09-12T22:01:00Z'))).toBe('2026-09-14');
  });
  it('rejects yesterday, today and all past dates', () => {
    for (const value of ['2026-09-11', '2026-09-12', '2020-01-01'])
      expect(isFutureDate(value, now)).toBe(false);
  });
  it('allows tomorrow and future dates', () => {
    expect(isFutureDate('2026-09-13', now)).toBe(true);
    expect(isFutureDate('2027-01-01', now)).toBe(true);
  });
  it('rolls the month, year and leap day correctly', () => {
    expect(tomorrowKigali(new Date('2026-12-31T12:00:00Z'))).toBe('2027-01-01');
    expect(tomorrowKigali(new Date('2028-02-28T12:00:00Z'))).toBe('2028-02-29');
    expect(tomorrowKigali(new Date('2026-09-30T12:00:00Z'))).toBe('2026-10-01');
  });
  it('rejects impossible and malformed dates', () => {
    for (const value of [
      '2026-02-30',
      '12/09/2026',
      '2026-13-01',
      '2026-09-12T00:00:00Z',
      '',
      '2026-9-13',
    ])
      expect(isValidDate(value)).toBe(false);
  });
});
describe('enquiry server validation', () => {
  afterEach(() => vi.useRealTimers());
  const valid = {
    customer_name: 'Test Customer',
    phone: '+250 790 009 264',
    event_type: 'birthday',
    event_date: '2026-09-13',
    guest_count: 25,
    message: '',
  };
  function clock() {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-12T10:00:00Z'));
  }
  it('accepts a valid enquiry and optional email', () => {
    clock();
    expect(bookingSchema.safeParse(valid).success).toBe(true);
    expect(bookingSchema.safeParse({ ...valid, email: 'hello@example.com' }).success).toBe(true);
  });
  it('rejects invalid fields', () => {
    clock();
    for (const invalid of [
      { customer_name: '' },
      { phone: 'not-a-phone' },
      { email: 'bad-email' },
      { event_type: '' },
      { guest_count: 0 },
      { guest_count: -1 },
      { guest_count: 1.5 },
      { guest_count: 100001 },
      { event_date: '2026-09-12' },
      { event_date: '2026-09-11' },
      { message: 'x'.repeat(3001) },
    ])
      expect(bookingSchema.safeParse({ ...valid, ...invalid }).success).toBe(false);
  });
  it('requires an unguessable idempotency key', () => {
    clock();
    expect(enquirySchema.safeParse(valid).success).toBe(false);
    expect(
      enquirySchema.safeParse({ ...valid, idempotency_key: crypto.randomUUID() }).success,
    ).toBe(true);
  });
  it('does not accept a date that became today since form creation', () => {
    clock();
    vi.setSystemTime(new Date('2026-09-12T22:01:00Z'));
    expect(bookingSchema.safeParse(valid).success).toBe(false);
  });
  it('strips attempted privilege escalation fields', () => {
    clock();
    const result = enquirySchema.parse({
      ...valid,
      idempotency_key: crypto.randomUUID(),
      status: 'approved',
      admin_notes: 'Injected',
      reference_number: 'Injected',
    });
    expect(result).not.toHaveProperty('status');
    expect(result).not.toHaveProperty('admin_notes');
    expect(result).not.toHaveProperty('reference_number');
  });
});
