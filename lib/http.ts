import { NextResponse } from 'next/server';
export function failure(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export function sameOrigin(request: Request) {
  // Next can expose an internal request.url behind Vercel/Arena's reverse proxy.
  // Compare against the original Host instead. Browser scripts cannot forge Host.
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const source = new URL(origin);
    const host =
      request.headers.get('x-forwarded-host')?.split(',')[0].trim() ||
      request.headers.get('host') ||
      new URL(request.url).host;
    return ['https:', 'http:'].includes(source.protocol) && source.host === host;
  } catch {
    return false;
  }
}
export async function safeJson(request: Request) {
  const maximum = 20_000;
  if (Number(request.headers.get('content-length') || 0) > maximum)
    throw new Error('PAYLOAD_TOO_LARGE');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('EMPTY_BODY');
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximum) {
      await reader.cancel();
      throw new Error('PAYLOAD_TOO_LARGE');
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let position = 0;
  for (const chunk of chunks) {
    body.set(chunk, position);
    position += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(body));
}
export function dbMessage(message: string) {
  if (message.includes('DATE_UNAVAILABLE') || message.includes('bookings_one_approved_date'))
    return 'This date is no longer available.';
  if (message.includes('INVALID_DATE')) return 'Choose tomorrow or a later date in Kigali.';
  if (message.includes('RATE_LIMITED'))
    return 'Too many enquiries. Please try again later or contact us.';
  if (message.includes('INVALID_SERVICE'))
    return 'This event type is no longer available. Please choose another.';
  if (message.includes('duplicate key'))
    return 'This record already exists. Refresh and try again.';
  return 'We could not save your changes. Please try again.';
}
