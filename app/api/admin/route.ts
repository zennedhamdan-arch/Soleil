import { NextResponse } from 'next/server';
import { z } from 'zod';
import sharp from 'sharp';
import { adminSession } from '@/lib/supabase/server';
import {
  bookingSchema,
  statusSchema,
  futureDate,
  serviceSchema,
  gallerySchema,
  settingsSchema,
} from '@/lib/validation';
import { failure, sameOrigin, safeJson, dbMessage } from '@/lib/http';
const id = z.uuid();
const operation = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('booking.create'),
    data: bookingSchema.extend({ status: statusSchema }),
  }),
  z.object({
    action: z.literal('booking.edit'),
    id,
    data: bookingSchema.extend({ admin_notes: z.string().max(10000) }),
  }),
  z.object({ action: z.literal('booking.status'), id, status: statusSchema }),
  z.object({ action: z.literal('booking.notes'), id, admin_notes: z.string().trim().max(10000) }),
  z.object({
    action: z.literal('block.create'),
    date: futureDate,
    reason: z.string().trim().min(1).max(300),
  }),
  z.object({ action: z.literal('block.delete'), id }),
  z.object({ action: z.literal('service.save'), id: id.optional(), data: serviceSchema }),
  z.object({ action: z.literal('gallery.save'), id: id.optional(), data: gallerySchema }),
  z.object({ action: z.literal('gallery.delete'), id }),
  z.object({ action: z.literal('settings.save'), data: settingsSchema }),
]);
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return failure('Request not allowed.', 403);
  try {
    const session = await adminSession();
    if (!session)
      return failure(
        'Your session has expired or you are not authorized. Please sign in again.',
        401,
      );
    const { db, profile } = session;
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      if (Number(request.headers.get('content-length') || 0) > 4500000)
        return failure('Choose an image smaller than 4 MB.', 413);
      const form = await request.formData();
      const image = form.get('image');
      if (
        !(image instanceof File) ||
        image.size > 4194304 ||
        !['image/jpeg', 'image/png', 'image/webp'].includes(image.type)
      )
        return failure('Use a JPEG, PNG or WebP image smaller than 4 MB.');
      let buffer: Buffer;
      try {
        buffer = await sharp(Buffer.from(await image.arrayBuffer()), { limitInputPixels: 40000000 })
          .rotate()
          .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
      } catch {
        return failure('This image could not be processed. Please choose another image.');
      }
      const path = `images/${crypto.randomUUID()}.webp`;
      const { error } = await db.storage
        .from('venue')
        .upload(path, buffer, { contentType: 'image/webp', cacheControl: '31536000' });
      if (error) return failure('Image upload failed. Please try again.', 503);
      const { data } = db.storage.from('venue').getPublicUrl(path);
      return NextResponse.json({ image_url: data.publicUrl });
    }
    const parsed = operation.safeParse(await safeJson(request));
    if (!parsed.success) return failure(parsed.error.issues[0].message);
    const op = parsed.data;
    let result;
    switch (op.action) {
      case 'booking.create': {
        const { data: service } = await db
          .from('services')
          .select('id')
          .eq('slug', op.data.event_type)
          .eq('active', true)
          .single();
        if (!service) return failure('Select an active event type.');
        result = await db.from('bookings').insert(op.data).select('id').single();
        break;
      }
      case 'booking.edit':
        result = await db.from('bookings').update(op.data).eq('id', op.id).select('id').single();
        break;
      case 'booking.status':
        result = await db
          .from('bookings')
          .update({ status: op.status })
          .eq('id', op.id)
          .select('id')
          .single();
        break;
      case 'booking.notes':
        result = await db
          .from('bookings')
          .update({ admin_notes: op.admin_notes })
          .eq('id', op.id)
          .select('id')
          .single();
        break;
      case 'block.create':
        result = await db
          .from('blocked_dates')
          .insert({ date: op.date, reason: op.reason })
          .select('id')
          .single();
        break;
      case 'block.delete':
        result = await db.from('blocked_dates').delete().eq('id', op.id).select('id').single();
        break;
      case 'service.save':
        result = op.id
          ? await db.from('services').update(op.data).eq('id', op.id).select('id').single()
          : await db.from('services').insert(op.data).select('id').single();
        break;
      case 'gallery.save':
        result = op.id
          ? await db.from('gallery').update(op.data).eq('id', op.id).select('id').single()
          : await db.from('gallery').insert(op.data).select('id').single();
        break;
      case 'gallery.delete':
        result = await db.from('gallery').delete().eq('id', op.id).select('id').single();
        break;
      case 'settings.save':
        if (profile.role !== 'admin')
          return failure('Only administrators can change site settings.', 403);
        result = await db.from('site_settings').update(op.data).eq('id', 1).select('id').single();
        break;
    }
    if (result.error) return failure(dbMessage(result.error.message), 409);
    return NextResponse.json({ ok: true, ...result.data });
  } catch {
    return failure('Unable to complete this request. Check your connection and try again.', 503);
  }
}
