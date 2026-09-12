import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { isValidDate, tomorrowKigali } from '@/lib/dates';
import { failure } from '@/lib/http';
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const start = params.get('start') || '',
    end = params.get('end') || '';
  if (
    !isValidDate(start) ||
    !isValidDate(end) ||
    end < start ||
    (Date.parse(end) - Date.parse(start)) / 86400000 > 62
  )
    return failure('Invalid calendar range.');
  try {
    const db = await supabase();
    const { data, error } = await db.rpc('availability', { start_date: start, end_date: end });
    if (error) throw error;
    return NextResponse.json(
      { unavailable: (data ?? []).map((x: { date: string }) => x.date), minimum: tomorrowKigali() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return failure('Availability is temporarily unavailable. Please try again or contact us.', 503);
  }
}
