import Link from 'next/link';
import { venuePhotos } from '@/lib/venue-photos';
import type { GalleryImage } from '@/lib/types';
import { PageHeading, GalleryGrid } from '@/components/public-ui';
import { isConfigured, supabase } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
export const metadata = {
  title: 'Venue & Event Gallery',
  description: 'Explore Soleil Garden venue photographs and event moments in Kigali, Rwanda.',
};
const categories = ['All', 'Weddings', 'Celebrations', 'Garden', 'Corporate', 'Other'];
export default async function Gallery({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const category = categories.includes(params.category || '') ? params.category! : 'All';
  const page = Math.min(10000, Math.max(1, parseInt(params.page || '1', 10) || 1));
  let images: GalleryImage[] = [];
  let count = 0;
  if (isConfigured()) {
    const db = await supabase();
    let q = db
      .from('gallery')
      .select('*', { count: 'exact' })
      .eq('active', true)
      .order('sort_order')
      .order('id')
      .range((page - 1) * 12, page * 12 - 1);
    if (category !== 'All') q = q.eq('category', category);
    const result = await q;
    if (result.error) throw new Error('The gallery is unavailable. Please try again.');
    images = result.data || [];
    count = result.count || 0;
  } else {
    const filtered = venuePhotos.filter(
      (image) => category === 'All' || image.category === category,
    );
    count = filtered.length;
    images = filtered.slice((page - 1) * 12, page * 12);
  }
  return (
    <div className="container pb-20">
      <PageHeading
        eyebrow="The gallery"
        title="A glimpse of beautiful possibilities."
        description="Explore the garden and the moments shared here. Imagine the occasion you could make your own."
      />
      <div className="gallery-toolbar">
        <div className="filter-tabs" aria-label="Gallery categories">
          {categories.map((c) => (
            <Link
              key={c}
              href={`/gallery?category=${c}`}
              className={category === c ? 'active' : ''}
            >
              {c}
            </Link>
          ))}
        </div>
        <span className="gallery-count">{count} photographs · A glimpse of Soleil</span>
      </div>
      <GalleryGrid images={images} />
      {count > 12 && (
        <div className="pagination">
          <span>
            Page {page} of {Math.ceil(count / 12)}
          </span>
          <div className="flex gap-3">
            {page > 1 && (
              <Button asChild variant="outline">
                <Link href={`/gallery?category=${category}&page=${page - 1}`}>Previous</Link>
              </Button>
            )}
            {page * 12 < count && (
              <Button asChild variant="outline">
                <Link href={`/gallery?category=${category}&page=${page + 1}`}>Next</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
