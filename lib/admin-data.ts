import 'server-only';
import { redirect } from 'next/navigation';
import { adminSession, isConfigured } from './supabase/server';
export async function requireAdmin() {
  if (!isConfigured()) redirect('/admin/login');
  const session = await adminSession();
  if (!session) redirect('/admin/login');
  return session;
}
export function assertQuery(error: unknown) {
  if (error) throw new Error('The requested records could not be loaded. Please try again.');
}
