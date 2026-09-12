import { requireAdmin, assertQuery } from '@/lib/admin-data';
import { AdminTitle } from '@/components/admin-ui';
import { SettingsForm } from '@/components/content-forms';
export default async function Settings() {
  const { db, profile } = await requireAdmin();
  if (profile.role !== 'admin')
    return (
      <>
        <AdminTitle
          title="Access restricted"
          description="Only administrators can manage business settings."
        />
      </>
    );
  const { data, error } = await db.from('site_settings').select('*').eq('id', 1).single();
  assertQuery(error);
  return (
    <>
      <AdminTitle
        title="Site settings"
        description="Keep your public business information up to date."
      />
      <SettingsForm settings={data} />
    </>
  );
}
