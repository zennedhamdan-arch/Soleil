import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getGallery } from '@/lib/data';
import { PageHeading, VenueArt, GalleryGrid } from '@/components/public-ui';
import { Button } from '@/components/ui/button';
export const metadata = {
  title: 'Garden Weddings in Kigali',
  description:
    'Begin your wedding or engagement enquiry at Soleil Garden, a garden event venue in Gikondo, Kigali, Rwanda.',
};
export default async function Weddings() {
  const images = await getGallery(12);
  const wedding = images.filter((i) => i.category === 'Weddings');
  return (
    <div className="container">
      <PageHeading
        eyebrow="Weddings at Soleil"
        title="For the beginning of your forever."
        description="Your people. Your promises. Your moment. Celebrate your wedding or engagement in a beautiful Kigali garden setting."
      />
      <div className="wedding-panel">
        <div className="wedding-art">
          <VenueArt image={wedding[0]} />
        </div>
        <div className="wedding-copy">
          <div className="eyebrow">A day that is yours</div>
          <h2>
            Let’s start with
            <br />
            your love story.
          </h2>
          <p>
            Tell us about the day you’re imagining. Share your date, guest estimate and any
            traditions or personal touches that matter to you.
          </p>
          <Button variant="outline" asChild>
            <Link href="/reserve?event=wedding-engagement">
              Enquire About Your Wedding <ArrowUpRight size={14} />
            </Link>
          </Button>
          <p className="text-xs">
            Our team will contact you to discuss availability and arrangements. An enquiry is not a
            confirmed reservation.
          </p>
        </div>
      </div>
      <section className="section">
        <div className="section-head">
          <h2>Moments from the garden.</h2>
          <Link href="/gallery" className="text-link">
            Explore Gallery <ArrowUpRight size={14} />
          </Link>
        </div>
        <GalleryGrid images={wedding.slice(0, 3)} />
      </section>
    </div>
  );
}
