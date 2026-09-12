import { redirect } from 'next/navigation';
import { adminSession, isConfigured } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin-shell';
export const dynamic = 'force-dynamic';
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  if (!isConfigured()) redirect('/admin/login');
  const session = await adminSession();
  if (!session) redirect('/admin/login');
  return (
    <AdminShell name={session.profile.name} role={session.profile.role}>
      {children}
    </AdminShell>
  );
}
