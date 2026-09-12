'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { bookingSchema, statusSchema } from '@/lib/validation';
import { adminRequest } from './admin-actions';
import { AvailabilityCalendar } from './availability-calendar';
import { Button } from './ui/button';
import type { Service, Booking } from '@/lib/types';
const schema = bookingSchema.extend({ status: statusSchema });
export function AdminBookingForm({
  services,
  booking,
  initialDate = '',
}: {
  services: Service[];
  booking?: Booking;
  initialDate?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_name: booking?.customer_name || '',
      phone: booking?.phone || '',
      email: booking?.email || '',
      event_type: booking?.event_type || '',
      event_date: booking?.event_date || initialDate,
      guest_count: booking?.guest_count || 1,
      message: booking?.message || '',
      status: booking?.status || 'pending',
    },
  });
  const date = useWatch({ control, name: 'event_date' });
  return (
    <form
      className="admin-panel admin-form"
      noValidate
      onSubmit={handleSubmit(async (data) => {
        setError('');
        try {
          const result = await adminRequest(
            booking
              ? {
                  action: 'booking.edit',
                  id: booking.id,
                  data: { ...data, admin_notes: booking.admin_notes },
                }
              : { action: 'booking.create', data },
          );
          toast.success(booking ? 'Booking updated' : 'Booking created');
          router.push(`/admin/bookings/${result.id}`);
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not save booking.');
        }
      })}
    >
      <div className="form-grid">
        {(
          [
            { name: 'customer_name', label: 'Customer name', type: 'text' },
            { name: 'phone', label: 'Phone number', type: 'tel' },
            { name: 'email', label: 'Email (optional)', type: 'email' },
            { name: 'guest_count', label: 'Guest count', type: 'number' },
          ] as const
        ).map((f) => (
          <div className="form-field" key={f.name}>
            <label htmlFor={f.name}>{f.label}</label>
            <input
              id={f.name}
              type={f.type}
              {...register(f.name, f.name === 'guest_count' ? { valueAsNumber: true } : {})}
            />
            {errors[f.name] && (
              <p className="field-error" role="alert">
                {errors[f.name]?.message}
              </p>
            )}
          </div>
        ))}
        <div className="form-field">
          <label htmlFor="event_type">Event type</label>
          <select id="event_type" {...register('event_type')}>
            <option value="">Select an event</option>
            {services.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name}
                {!s.active ? ' (inactive)' : ''}
              </option>
            ))}
          </select>
          {errors.event_type && <p className="field-error">{errors.event_type.message}</p>}
        </div>
        {!booking && (
          <div className="form-field">
            <label htmlFor="status">Initial status</label>
            <select id="status" {...register('status')}>
              {['pending', 'approved', 'rejected', 'cancelled'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
        <div className="span-2 my-4">
          <div className="field-label mb-4">
            Event date {date && <span className="font-normal">· {date}</span>}
          </div>
          <AvailabilityCalendar
            value={date}
            onChange={(date) => setValue('event_date', date, { shouldValidate: true })}
          />
          {errors.event_date && <p className="field-error">{errors.event_date.message}</p>}
        </div>
        <div className="form-field span-2">
          <label htmlFor="message">Message / event details</label>
          <textarea id="message" {...register('message')} maxLength={3000} />
        </div>
      </div>
      {error && (
        <div className="notice error-notice my-4" role="alert">
          {error}
        </div>
      )}
      <div className="flex gap-3 mt-5">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : booking ? 'Save Changes' : 'Create Booking'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
      <p className="text-[10px] mt-5">
        Date availability is validated by the server. Approvals reserve the entire date.
      </p>
    </form>
  );
}
