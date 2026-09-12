'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ArrowLeft, Check, CheckCircle2, LoaderCircle, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { bookingSchema, type BookingInput } from '@/lib/validation';
import type { Service } from '@/lib/types';
import { prettyDate } from '@/lib/utils';
import { Button } from './ui/button';
import { AvailabilityCalendar } from './availability-calendar';
const steps = ['Event', 'Date', 'Details', 'Contact', 'Review'];
export function ReservationForm({
  services,
  initialEvent,
}: {
  services: Service[];
  initialEvent: string;
}) {
  const [step, setStep] = useState(0),
    [error, setError] = useState(''),
    [reference, setReference] = useState(''),
    [busy, setBusy] = useState(false);
  const [key, setKey] = useState('');
  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customer_name: '',
      phone: '',
      email: '',
      event_type: services.some((s) => s.slug === initialEvent) ? initialEvent : '',
      event_date: '',
      guest_count: undefined as number | undefined,
      message: '',
    },
    mode: 'onTouched',
  });
  const values = useWatch({ control: form.control });
  const errors = form.formState.errors;
  async function next() {
    const fields: (keyof BookingInput)[][] = [
      ['event_type'],
      ['event_date'],
      ['guest_count', 'message'],
      ['customer_name', 'phone', 'email'],
    ];
    if (await form.trigger(fields[step])) {
      setStep((s) => s + 1);
      setError('');
    }
  }
  async function submit(data: BookingInput) {
    if (busy) return;
    setBusy(true);
    setError('');
    const idempotency = key || crypto.randomUUID();
    setKey(idempotency);
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, idempotency_key: idempotency, website: '' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not submit your enquiry.');
      setReference(result.reference_number);
      toast.success('Booking enquiry submitted');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Network failure. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }
  if (reference)
    return (
      <div className="panel success" role="status">
        <div className="success-icon">
          <CheckCircle2 size={32} />
        </div>
        <div className="eyebrow justify-center">Thank you for reaching out</div>
        <h2>
          Your event enquiry
          <br />
          has been received.
        </h2>
        <p>
          The Soleil Garden team will review your request and contact you to discuss the next steps.
        </p>
        <div className="reference">{reference}</div>
        <p className="text-xs">
          Save this reference for your records. This is an enquiry acknowledgement, not a confirmed
          booking. Your date is not reserved until the team approves your booking.
        </p>
        <Button variant="outline" asChild>
          <Link href="/">Return to the Garden</Link>
        </Button>
      </div>
    );
  if (!services.length)
    return (
      <div className="panel">
        <Leaf size={32} strokeWidth={1} />
        <h3 className="mt-5">Let’s start with a conversation.</h3>
        <div className="notice">
          Online event enquiries are not currently available. Please contact Soleil Garden by phone
          or WhatsApp to discuss your event.
        </div>
      </div>
    );
  return (
    <form
      className="panel"
      onSubmit={(event) => {
        if (step < 4) {
          event.preventDefault();
          void next();
        } else {
          void form.handleSubmit(submit)(event);
        }
      }}
      noValidate
    >
      <nav className="stepper" aria-label="Enquiry progress">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`step ${i === step ? 'current' : i < step ? 'done' : ''}`}
            aria-current={i === step ? 'step' : undefined}
          >
            <span className="step-number">{i < step ? <Check size={12} /> : i + 1}</span>
            {s}
          </div>
        ))}
      </nav>
      <div aria-live="polite">
        <h3>
          {
            [
              'What are you celebrating?',
              'Choose your preferred date.',
              'Tell us a little more.',
              'How can we reach you?',
              'A moment to review.',
            ][step]
          }
        </h3>
        <p className="text-xs mb-6">
          {
            [
              'Choose the occasion you have in mind.',
              'Select an available date from tomorrow onward.',
              'An estimate is fine. We’ll discuss the details with you.',
              'Our team will use these details to follow up on your enquiry.',
              'Check your details before sending your event enquiry.',
            ][step]
          }
        </p>
      </div>
      {step === 0 && (
        <>
          <div className="event-options" role="group" aria-label="Event type">
            {services.map((s) => (
              <button
                type="button"
                key={s.id}
                className={`event-option ${values.event_type === s.slug ? 'selected' : ''}`}
                aria-pressed={values.event_type === s.slug}
                onClick={() => form.setValue('event_type', s.slug, { shouldValidate: true })}
              >
                {s.name}
                {values.event_type === s.slug ? (
                  <Check size={15} />
                ) : (
                  <Leaf size={14} strokeWidth={1} />
                )}
              </button>
            ))}
          </div>
          {errors.event_type && (
            <p role="alert" className="field-error mt-3">
              {errors.event_type.message}
            </p>
          )}
        </>
      )}
      {step === 1 && (
        <>
          <AvailabilityCalendar
            value={values.event_date || ''}
            onChange={(date) => form.setValue('event_date', date, { shouldValidate: true })}
          />
          {errors.event_date && (
            <p role="alert" className="field-error">
              {errors.event_date.message}
            </p>
          )}
        </>
      )}
      {step === 2 && (
        <>
          <div className="form-field">
            <label htmlFor="guest_count">Estimated guest count *</label>
            <input
              id="guest_count"
              type="number"
              min="1"
              max="100000"
              placeholder="How many people will be joining?"
              {...form.register('guest_count', { valueAsNumber: true })}
              aria-invalid={!!errors.guest_count}
              aria-describedby="guests-error"
            />
            {errors.guest_count && (
              <p id="guests-error" role="alert" className="field-error">
                {errors.guest_count.message}
              </p>
            )}
            <p className="text-[10px]">This is an estimate, not confirmation of venue capacity.</p>
          </div>
          <div className="form-field">
            <label htmlFor="message">
              Anything else you’d like us to know? <span className="font-normal">(optional)</span>
            </label>
            <textarea
              id="message"
              maxLength={3000}
              placeholder="Tell us about your plans, preferences or questions…"
              {...form.register('message')}
            />
            {errors.message && (
              <p role="alert" className="field-error">
                {errors.message.message}
              </p>
            )}
          </div>
        </>
      )}
      {step === 3 && (
        <>
          {(
            [
              {
                name: 'customer_name',
                label: 'Full name *',
                type: 'text',
                autoComplete: 'name',
                placeholder: 'Your full name',
              },
              {
                name: 'phone',
                label: 'Phone number *',
                type: 'tel',
                autoComplete: 'tel',
                placeholder: '+250 …',
              },
              {
                name: 'email',
                label: 'Email address (optional)',
                type: 'email',
                autoComplete: 'email',
                placeholder: 'you@example.com',
              },
            ] as const
          ).map((f) => (
            <div className="form-field" key={f.name}>
              <label htmlFor={f.name}>{f.label}</label>
              <input
                id={f.name}
                type={f.type}
                autoComplete={f.autoComplete}
                placeholder={f.placeholder}
                {...form.register(f.name)}
                aria-invalid={!!errors[f.name]}
                aria-describedby={`${f.name}-error`}
              />
              {errors[f.name] && (
                <p id={`${f.name}-error`} role="alert" className="field-error">
                  {errors[f.name]?.message}
                </p>
              )}
            </div>
          ))}
          <p className="text-[11px]">
            Your details are shared only with the Soleil Garden team to manage this enquiry. Please
            don’t include sensitive personal information.
          </p>
        </>
      )}
      {step === 4 && (
        <>
          <div className="summary-row">
            <span>Event</span>
            <strong>{services.find((s) => s.slug === values.event_type)?.name}</strong>
          </div>
          <div className="summary-row">
            <span>Preferred date</span>
            <strong>{values.event_date ? prettyDate(values.event_date) : 'Not selected'}</strong>
          </div>
          <div className="summary-row">
            <span>Estimated guests</span>
            <strong>{values.guest_count}</strong>
          </div>
          <div className="summary-row">
            <span>Name</span>
            <strong>{values.customer_name}</strong>
          </div>
          <div className="summary-row">
            <span>Phone</span>
            <strong>{values.phone}</strong>
          </div>
          {values.email && (
            <div className="summary-row">
              <span>Email</span>
              <strong className="break-all">{values.email}</strong>
            </div>
          )}
          {values.message && (
            <div className="mt-4">
              <p className="text-xs">Your message</p>
              <div className="text-xs whitespace-pre-wrap mt-2">{values.message}</div>
            </div>
          )}
          <div className="notice mt-6">
            This is an event enquiry, not a confirmed booking. Our team will review the details and
            contact you.
          </div>
        </>
      )}
      {error && (
        <div role="alert" className="notice error-notice mt-5">
          {error}
        </div>
      )}
      {step === 4 && Object.keys(errors).length > 0 && (
        <p className="field-error mt-4" role="alert">
          Please go back and check your details. Your date must still be tomorrow or later.
        </p>
      )}
      <div className="form-actions">
        {step > 0 ? (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => setStep((s) => s - 1)}
          >
            <ArrowLeft size={14} />
            Back
          </Button>
        ) : (
          <span className="text-[10px] text-stone-500 self-center">Step {step + 1} of 5</span>
        )}
        {step < 4 ? (
          <Button type="button" onClick={next}>
            Continue <ArrowRight size={14} />
          </Button>
        ) : (
          <Button type="submit" disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle size={15} className="animate-spin" />
                Sending…
              </>
            ) : (
              <>
                Send Event Enquiry <ArrowUpRightIcon />
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={14} style={{ transform: 'rotate(-45deg)' }} />;
}
