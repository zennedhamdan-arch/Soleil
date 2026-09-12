// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ReservationForm } from '../components/reservation-form';
import { tomorrowKigali } from '../lib/dates';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const services = [
  {
    id: crypto.randomUUID(),
    name: 'Birthday',
    slug: 'birthday',
    description: 'Test service',
    image_url: '',
    active: true,
  },
];
async function completeReview() {
  fireEvent.click(screen.getByRole('button', { name: 'Birthday' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('heading', { name: 'Choose your preferred date.' });
  const date = await screen.findByRole('button', { name: `${tomorrowKigali()}, available` });
  fireEvent.click(date);
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  const guest = await screen.findByLabelText('Estimated guest count *');
  fireEvent.change(guest, { target: { value: '25' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.change(await screen.findByLabelText('Full name *'), {
    target: { value: 'Test Customer' },
  });
  fireEvent.change(screen.getByLabelText('Phone number *'), { target: { value: '+250790000000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('heading', { name: 'A moment to review.' });
}
describe('multi-step enquiry flow', () => {
  it('requires a selected event before advancing', async () => {
    render(<ReservationForm services={services} initialEvent="" />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('heading', { name: 'What are you celebrating?' })).toBeDefined();
  });
  it('submits reviewed details and shows acknowledgement, not confirmation', async () => {
    const fetcher = vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () =>
        url.startsWith('/api/availability')
          ? { minimum: tomorrowKigali(), unavailable: [] }
          : { reference_number: 'SG-20260912-001' },
    }));
    vi.stubGlobal('fetch', fetcher);
    render(<ReservationForm services={services} initialEvent="" />);
    await completeReview();
    fireEvent.click(screen.getByRole('button', { name: 'Send Event Enquiry' }));
    await screen.findByText('SG-20260912-001');
    expect(
      screen.getByText(/This is an enquiry acknowledgement, not a confirmed booking/),
    ).toBeDefined();
    const call = fetcher.mock.calls.find((c) => c[0] === '/api/enquiries');
    expect(call).toBeDefined();
    const body = JSON.parse(call![1].body);
    expect(body.customer_name).toBe('Test Customer');
    expect(body.guest_count).toBe(25);
    expect(body.event_date).toBe(tomorrowKigali());
    expect(body.idempotency_key).toMatch(/^[a-f0-9-]{36}$/);
    expect(body).not.toHaveProperty('status');
  });
  it('retains an idempotency key on retry after a network failure', async () => {
    let attempts = 0;
    const keys: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string, options: RequestInit) => {
        if (url.startsWith('/api/availability'))
          return { ok: true, json: async () => ({ minimum: tomorrowKigali(), unavailable: [] }) };
        keys.push(JSON.parse(options.body as string).idempotency_key);
        if (attempts++ === 0) throw new Error('Network failure');
        return { ok: true, json: async () => ({ reference_number: 'SG-20260912-002' }) };
      }),
    );
    render(<ReservationForm services={services} initialEvent="" />);
    await completeReview();
    fireEvent.click(screen.getByRole('button', { name: 'Send Event Enquiry' }));
    await screen.findByRole('alert');
    await waitFor(() =>
      expect(
        (screen.getByRole('button', { name: 'Send Event Enquiry' }) as HTMLButtonElement).disabled,
      ).toBe(false),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send Event Enquiry' }));
    await screen.findByText('SG-20260912-002');
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]);
  });
});
