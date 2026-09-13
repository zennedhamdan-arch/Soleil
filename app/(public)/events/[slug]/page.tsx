import { notFound } from 'next/navigation';
import { VenueImage } from '@/components/venue-image';
import Link from 'next/link';
import { ArrowUpRight, Leaf } from 'lucide-react';
import { getServices } from '@/lib/data';
import { PageHeading } from '@/components/public-ui';
import { Button } from '@/components/ui/button';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = (await getServices()).find((s) => s.slug === slug);
  return { title: s?.name || 'Event not found', description: s?.description };
}
export default async function Event({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = (await getServices()).find((s) => s.slug === slug);
  if (!s) notFound();
  return (
    <div className="container pb-20">
      <PageHeading eyebrow="Our events" title={s.name} description={s.description} />
      <div className="two-col">
        <div className="asset-detail-image">
          {s.image_url ? (
            <VenueImage
              src={s.image_url}
              alt={s.name}
              fill
              sizes="(max-width:580px) 100vw,60vw"
              priority
            />
          ) : (
            <div className="photo-placeholder min-h-[400px]">
              <Leaf size={70} strokeWidth={0.8} />
              <span>LET YOUR MOMENT BLOOM</span>
            </div>
          )}
        </div>
        <div className="panel">
          <div className="eyebrow">Let’s plan together</div>
          <h2>A celebration that feels like you.</h2>
          <p className="my-6">
            Share your preferred date, estimated number of guests and what you have in mind. Our
            team will review your enquiry and get in touch to discuss the details.
          </p>
          <Button asChild>
            <Link href={`/reserve?event=${s.slug}`}>
              Plan This Event <ArrowUpRight size={15} />
            </Link>
          </Button>
          <p className="mt-6 text-xs">
            All event arrangements and suitability are discussed directly with the venue. Sending an
            enquiry does not confirm a booking.
          </p>
        </div>
      </div>
    </div>
  );
}
