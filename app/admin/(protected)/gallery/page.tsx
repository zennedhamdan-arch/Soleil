import { VenueImage } from '@/components/venue-image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin, assertQuery } from '@/lib/admin-data';
import { AdminTitle } from '@/components/admin-ui';
import { ConfirmAction } from '@/components/admin-actions';
import { GalleryForm } from '@/components/content-forms';
import { Button } from '@/components/ui/button';
export default async function Gallery({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; page?: string }>;
}) {
  const [{ db }, p] = await Promise.all([requireAdmin(), searchParams]);
  const page = Math.max(1, parseInt(p.page || '1') || 1);
  let editor = null;
  if (p.edit) {
    if (p.edit === 'new') editor = <GalleryForm />;
    else {
      if (!z.uuid().safeParse(p.edit).success) notFound();
      const { data, error } = await db.from('gallery').select('*').eq('id', p.edit).maybeSingle();
      assertQuery(error);
      if (!data) notFound();
      editor = <GalleryForm key={data.id} image={data} />;
    }
  }
  const { data, count, error } = await db
    .from('gallery')
    .select('*', { count: 'exact' })
    .order('sort_order')
    .order('id')
    .range((page - 1) * 18, page * 18 - 1);
  assertQuery(error);
  return (
    <>
      <AdminTitle
        title="Gallery"
        description="Real photographs. Beautiful moments. Your public venue gallery."
      >
        <Button asChild>
          <Link href="/admin/gallery?edit=new">
            <Plus size={15} />
            Upload Image
          </Link>
        </Button>
      </AdminTitle>
      {editor || (
        <>
          {data?.length ? (
            <div className="image-admin-grid">
              {data.map((i) => (
                <article className="image-admin-card bg-white" key={i.id}>
                  <div className="image">
                    <VenueImage
                      src={i.image_url}
                      alt={i.title}
                      fill
                      sizes="(max-width:580px)100vw,33vw"
                    />
                  </div>
                  <div className="body">
                    <div className="flex justify-between gap-3 mb-2">
                      <h3 className="text-sm">{i.title}</h3>
                      <span className={`badge ${i.active ? 'approved' : 'cancelled'}`}>
                        {i.active ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-[10px] mb-4">
                      {i.category} · Order {i.sort_order}
                    </p>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/gallery?edit=${i.id}`}>Edit / Reorder</Link>
                      </Button>
                      <ConfirmAction
                        label="Delete"
                        message="Remove this image from the gallery? This cannot be undone. The stored file is retained so existing service image links are not broken."
                        payload={{ action: 'gallery.delete', id: i.id }}
                        success="Gallery image deleted"
                        destructive
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">
              <h3 className="serif">Let the garden speak for itself.</h3>
              <p>Upload your Soleil Garden photographs to bring the website to life.</p>
            </div>
          )}
          <div className="pagination">
            <span>
              {count || 0} images · Page {page}
            </span>
            <div className="flex gap-3">
              {page > 1 && <Link href={`/admin/gallery?page=${page - 1}`}>← Previous</Link>}
              {page * 18 < (count || 0) && (
                <Link href={`/admin/gallery?page=${page + 1}`}>Next →</Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
