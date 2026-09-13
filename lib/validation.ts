import { z } from 'zod';
import { isFutureDate } from './dates';
import { isBundledVenuePhoto, resolveVenueImage } from './venue-photos';
export const futureDate = z
  .string()
  .refine((v) => isFutureDate(v), 'Choose tomorrow or a later date in Kigali.');
export const bookingSchema = z.object({
  customer_name: z.string().trim().min(2, 'Enter your full name.').max(120),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(30)
    .regex(/^\+?[\d\s()\-]+$/, 'Enter a valid phone number.'),
  email: z
    .union([z.literal(''), z.email().max(254)])
    .optional()
    .default(''),
  event_type: z.string().trim().min(1, 'Choose an event type.').max(100),
  event_date: futureDate,
  guest_count: z
    .number()
    .int()
    .min(1, 'Enter at least one guest.')
    .max(100000, 'Please contact us for this enquiry.'),
  message: z.string().trim().max(3000).default(''),
});
export const enquirySchema = bookingSchema.extend({
  idempotency_key: z.uuid(),
  website: z.string().max(0).optional(),
});
export type BookingInput = z.infer<typeof bookingSchema>;
export const loginSchema = z.object({ email: z.email(), password: z.string().min(1).max(200) });
export const statusSchema = z.enum(['pending', 'approved', 'rejected', 'cancelled']);
const imageUrl = z
  .union([
    z.literal(''),
    z.string().refine(isBundledVenuePhoto, 'Choose an existing venue photograph.'),
    z.url().refine((v) => {
      try {
        return (
          new URL(v).origin === new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin &&
          new URL(v).pathname.startsWith('/storage/v1/object/public/venue/')
        );
      } catch {
        return false;
      }
    }, 'Use an image uploaded to venue storage.'),
  ])
  .transform(resolveVenueImage);
export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100),
  description: z.string().trim().min(5).max(2000),
  image_url: imageUrl,
  active: z.boolean(),
});
export const gallerySchema = z.object({
  image_url: imageUrl.refine(Boolean, 'Upload an image.'),
  title: z.string().trim().min(2).max(160),
  category: z.enum(['Weddings', 'Celebrations', 'Garden', 'Corporate', 'Other']),
  sort_order: z.number().int().min(0).max(10000),
  active: z.boolean(),
});
export const settingsSchema = z.object({
  business_name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .min(7)
    .max(30)
    .regex(/^\+?[\d\s()\-]+$/),
  whatsapp: z.string().regex(/^\+?\d{7,15}$/),
  address: z.string().min(3).max(300),
  description: z.string().max(2000),
  social_links: z.record(
    z.string().max(40),
    z.url().refine((v) => v.startsWith('https://')),
  ),
});
