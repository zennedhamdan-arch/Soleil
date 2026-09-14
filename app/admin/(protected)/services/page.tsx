import Link from 'next/link';
import { VenueImage } from '@/components/venue-image';
import { Plus, Leaf } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireAdmin, assertQuery } from '@/lib/admin-data';
import { AdminTitle } from '@/components/admin-ui';
import { ServiceForm } from '@/components/content-forms';
import { Button } from '@/components/ui/button';
export default async function Services({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const [{ db }, p] = await Promise.all([requireAdmin(), searchParams]);
  const { data, error } = await db.from('services').select('*').order('created_at');
  assertQuery(error);
  const selected = data?.find((s) => s.id === p.edit);
  if (p.edit && p.edit !== 'new' && !selected) notFound();
  return (
    <>
      <AdminTitle
        title="Services & event types"
        description="Manage the occasions customers can enquire about."
      >
        <Button asChild>
          <Link href="/admin/services?edit=new">
            <Plus size={15} />
            Add Service
          </Link>
        </Button>
      </AdminTitle>
      {p.edit ? (
        <ServiceForm key={p.edit} service={selected} />
      ) : data?.length ? (
        <div className="image-admin-grid">
          {data.map((s) => (
            <article className="image-admin-card bg-white" key={s.id}>
              <div className="image">
                {s.image_url ? (
                  <VenueImage
                    src={s.image_url}
                    alt={s.name}
                    fill
                    sizes="(max-width:580px)100vw,33vw"
                  />
                ) : (
                  <div className="photo-placeholder">
                    <Leaf size={35} strokeWidth={1} />
                  </div>
                )}
              </div>
              <div className="body">
                <div className="flex justify-between gap-2 mb-3">
                  <h3 className="serif text-xl">{s.name}</h3>
                  <span className={`badge ${s.active ? 'approved' : 'cancelled'}`}>
                    {s.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs mb-4 line-clamp-3">{s.description}</p>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/services?edit=${s.id}`}>Edit Service</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">No services yet. Add your first event type.</div>
      )}
    </>
  );
}
