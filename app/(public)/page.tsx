import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, MapPin, Leaf, Sun, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceCards, VenueArt, GalleryGrid, EventCTA } from '@/components/public-ui';
import { getServices, getGallery } from '@/lib/data';
export default async function Home() {
  const [services, images] = await Promise.all([getServices(), getGallery(4)]);
  return (
    <>
      <div className="container">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">Kigali’s garden for your special moments</div>
            <h1>
              Celebrate Your
              <br />
              Moments at
              <br />
              <em>Soleil Garden</em>
            </h1>
            <p className="hero-description">
              A beautiful Kigali setting for weddings, celebrations, gatherings and unforgettable
              events.
            </p>
            <div className="hero-actions">
              <Button asChild>
                <Link href="/reserve">
                  Plan Your Event <ArrowUpRight size={15} />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/gallery">
                  Explore the Garden <ArrowUpRight size={15} />
                </Link>
              </Button>
            </div>
            <div className="hero-foot">
              <MapPin size={13} /> Gikondo / KK35 Avenue, Kigali, Rwanda
            </div>
          </div>
          <div className={`hero-art ${images.length ? 'hero-photographs' : ''}`}>
            <div className="hero-photo-main">
              <VenueArt image={images[0]} priority />
            </div>
            {images[1] && (
              <div className="hero-photo-inset">
                <Image
                  src={images[1].image_url}
                  alt={images[1].title}
                  fill
                  sizes="(max-width:580px) 42vw, 235px"
                  priority
                />
                <span>A GLIMPSE OF SOLEIL</span>
              </div>
            )}
            {images.length > 0 && (
              <div className="hero-photo-label">
                <span>SOLEIL GARDEN</span>
                <i>A moment, beautifully framed.</i>
              </div>
            )}
            <div className="round-seal">
              <span>LOVE. GATHER.</span>
              <Sun size={27} strokeWidth={1} />
              <span>CELEBRATE.</span>
            </div>
            <div className="hero-badge">
              <Leaf size={31} strokeWidth={1} />
              <div>
                <b>Where moments bloom.</b>
                <span>A GARDEN. A GATHERING. A MEMORY.</span>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div className="occasion-strip">
        <div className="container">
          <span className="tiny">MADE FOR LIFE’S OCCASIONS</span>
          <span>Weddings & Engagements</span>
          <span className="dot">✦</span>
          <span>Celebrations</span>
          <span className="dot">✦</span>
          <span>Corporate Gatherings</span>
          <span className="dot">✦</span>
          <span>And your next chapter</span>
        </div>
      </div>
      <section className="section container">
        <div className="intro-grid">
          <div>
            <div className="eyebrow">Welcome to Soleil Garden</div>
            <h2>
              A little closer to nature.
              <br />A little closer to each other.
            </h2>
          </div>
          <div>
            <p>
              Some moments deserve a setting as special as the people in them. At Soleil Garden, we
              bring a beautiful garden backdrop to your celebrations in Kigali.
            </p>
            <p className="mt-4">
              From “I do” to another year around the sun, make space for the moments that matter.
            </p>
            <Link href="/about" className="text-link">
              Get to Know the Garden <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section soft-section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Many occasions. One beautiful setting.</div>
              <h2>What are you celebrating?</h2>
            </div>
            <Link href="/events" className="text-link">
              Explore All Events <ArrowUpRight size={14} />
            </Link>
          </div>
          <ServiceCards services={services.slice(0, 3)} />
        </div>
      </section>
      <section className="section container">
        <div className="eyebrow">The Soleil feeling</div>
        <h2>
          Good company. A garden setting.
          <br />
          Something to celebrate.
        </h2>
        <div className="values">
          {[
            [
              Leaf,
              'A natural backdrop',
              'Let the garden be the setting for the people and moments that matter.',
            ],
            [
              Heart,
              'Your kind of celebration',
              'A wedding, a milestone or a gathering. Start with your occasion and tell us your vision.',
            ],
            [
              MapPin,
              'Here in Kigali',
              'Find Soleil Garden in Gikondo, on KK35 Avenue. Get in touch to plan your visit.',
            ],
          ].map(([Icon, title, text]) => {
            const I = Icon as typeof Leaf;
            return (
              <div key={String(title)}>
                <div className="value-icon">
                  <I size={22} strokeWidth={1.2} />
                </div>
                <h3>{String(title)}</h3>
                <p>{String(text)}</p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="container">
        <div className="wedding-panel">
          <div className="wedding-art">
            <VenueArt image={images.filter((i) => i.category === 'Weddings')[1] || images[0]} />
          </div>
          <div className="wedding-copy">
            <div className="eyebrow">For your forever</div>
            <h2>
              Your love story.
              <br />A beautiful beginning.
            </h2>
            <p>
              An engagement, a wedding, a promise to one another. Bring the people you love together
              in a garden setting, and make the day your own.
            </p>
            <Button asChild variant="outline">
              <Link href="/weddings">
                Discover Weddings <ArrowUpRight size={15} />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-head">
          <div>
            <div className="eyebrow">A glimpse of the garden</div>
            <h2>Picture your moment here.</h2>
          </div>
          <Link href="/gallery" className="text-link">
            View the Gallery <ArrowUpRight size={14} />
          </Link>
        </div>
        <GalleryGrid images={images.slice(1, 4)} />
      </section>
      <section className="container pb-16">
        <EventCTA />
      </section>
    </>
  );
}
