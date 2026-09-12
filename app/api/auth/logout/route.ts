import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { failure, sameOrigin } from '@/lib/http';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return failure('Request not allowed.', 403);
  try {
    const db = await supabase();
    await db.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch {
    return failure('Could not sign out. Please try again.', 503);
  }
}
