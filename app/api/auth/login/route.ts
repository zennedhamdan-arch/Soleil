import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation';
import { supabase } from '@/lib/supabase/server';
import { failure, sameOrigin, safeJson } from '@/lib/http';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return failure('Request not allowed.', 403);
  try {
    const parsed = loginSchema.safeParse(await safeJson(request));
    if (!parsed.success) return failure('Enter a valid email and password.');
    const db = await supabase();
    const { data, error } = await db.auth.signInWithPassword(parsed.data);
    if (error) return failure('Incorrect credentials or too many attempts. Please try again.', 401);
    const { data: profile } = await db
      .from('admin_profiles')
      .select('id')
      .eq('user_id', data.user.id)
      .single();
    if (!profile) {
      await db.auth.signOut();
      return failure('This account does not have admin access.', 403);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return failure('Sign-in is currently unavailable. Please contact your administrator.', 503);
  }
}
