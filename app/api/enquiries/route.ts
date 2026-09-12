import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { enquirySchema } from '@/lib/validation';
import { privileged } from '@/lib/supabase/server';
import { failure, sameOrigin, safeJson, dbMessage } from '@/lib/http';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return failure('Request not allowed.', 403);
  try {
    const parsed = enquirySchema.safeParse(await safeJson(request));
    if (!parsed.success) return failure(parsed.error.issues[0].message);
    if (!process.env.RATE_LIMIT_SALT)
      return failure('Online enquiries are not configured. Please contact Soleil Garden.', 503);
    const ip =
      request.headers.get('x-vercel-forwarded-for') ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      'unknown';
    const key = createHash('sha256')
      .update(process.env.RATE_LIMIT_SALT + ip)
      .digest('hex');
    const { data, error } = await privileged().rpc('submit_enquiry', {
      payload: parsed.data,
      request_key: key,
    });
    if (error)
      return failure(dbMessage(error.message), error.message.includes('RATE_LIMITED') ? 429 : 409);
    return NextResponse.json(data, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return failure('We could not send your enquiry. Please try again or contact us.', 503);
  }
}
