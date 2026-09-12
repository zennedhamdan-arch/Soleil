import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Leaf, MapPin, Phone, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import type { Service, GalleryImage, Settings } from '@/lib/types';
import { whatsapp } from '@/lib/data';
export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>{eyebrow}</span>
      </div>
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
export function VenueArt({
  image,
  priority = false,
}: {
  image?: GalleryImage;
  priority?: boolean;
}) {
  return (
    <>
      <Image
        src={image?.image_url || '/garden-illustration.svg'}
        alt={
          image?.title || 'Botanical illustration of a sunlit garden, not a photograph of the venue'
        }
        fill
        sizes="(max-width: 580px) 90vw, 50vw"
        priority={priority}
      />
      {!image && <span className="art-note">A GARDEN INSPIRATION · ILLUSTRATION</span>}
    </>
  );
}
export function ServiceCards({ services }: { services: Service[] }) {
  return services.length ? (
    <div className="service-grid">
      {services.map((s, i) => (
        <article className="service-card" key={s.id}>
          <Link
            href={`/events/${s.slug}`}
            className="card-media"
            style={{ display: 'block' }}
            aria-label={`Explore ${s.name}`}
          >
            {s.image_url ? (
              <Image src={s.image_url} alt={s.name} fill sizes="(max-width:580px) 100vw, 33vw" />
            ) : (
              <div className="photo-placeholder">
                <Leaf size={48} strokeWidth={0.8} />
                <span>YOUR OCCASION, OUR GARDEN</span>
              </div>
            )}
            <span className="service-number">0{i + 1}</span>
          </Link>
          <div className="service-body">
            <h3>{s.name}</h3>
            <p>{s.description}</p>
            <Link href={`/reserve?event=${s.slug}`} className="text-link">
              Plan This Event <ArrowUpRight size={14} />
            </Link>
          </div>
        </article>
      ))}
    </div>
  ) : (
    <div className="empty">
      <Leaf size={28} className="mx-auto" />
      <h3 className="serif mt-3">A setting for your next occasion</h3>
      <p>For weddings, birthdays, corporate gatherings and more, tell us what you have in mind.</p>
      <Button asChild variant="outline">
        <Link href="/contact">
          Discuss Your Event <ArrowUpRight size={14} />
        </Link>
      </Button>
    </div>
  );
}
export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  return images.length ? (
    <div className="gallery-grid">
      {images.map((image) => (
        <figure className="gallery-item" key={image.id}>
          <Image
            src={image.image_url}
            alt={image.title}
            fill
            sizes="(max-width:580px) 50vw, 33vw"
          />
          <figcaption>{image.title}</figcaption>
        </figure>
      ))}
    </div>
  ) : (
    <div className="empty">
      <Leaf size={30} strokeWidth={1} className="mx-auto mb-4" />
      <h3 className="serif">A closer look, coming soon</h3>
      <p>
        Our venue photographs haven’t been added yet. Contact us to ask about visiting the garden.
      </p>
      <Link className="text-link" href="/contact">
        Get in Touch <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}
export function EventCTA() {
  return (
    <div className="cta-panel">
      <div className="eyebrow justify-center">Let’s make it memorable</div>
      <h2>
        Your occasion. Your people.
        <br />A beautiful place to come together.
      </h2>
      <p>Tell us what you’re dreaming of. We’ll take the next step together.</p>
      <Button asChild>
        <Link href="/reserve">
          Plan Your Event <ArrowUpRight size={15} />
        </Link>
      </Button>
      <p style={{ fontSize: 10, marginBottom: 0 }}>
        An enquiry is the beginning of a conversation, not a confirmed booking.
      </p>
    </div>
  );
}
export function ContactStrip({ settings: s }: { settings: Settings }) {
  return (
    <div className="container contact-strip">
      <div className="contact-bit">
        <MapPin size={22} strokeWidth={1.3} />
        <div>
          <span>FIND US IN KIGALI</span>
          <strong>{s.address}</strong>
        </div>
      </div>
      <a className="contact-bit" href={`tel:${s.phone.replace(/\s/g, '')}`}>
        <Phone size={21} strokeWidth={1.3} />
        <div>
          <span>LET’S TALK</span>
          <strong>{s.phone}</strong>
        </div>
      </a>
      <a
        className="contact-bit"
        href={whatsapp(s.whatsapp)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle size={23} strokeWidth={1.3} />
        <div>
          <span>A LITTLE QUESTION?</span>
          <strong>Say hello on WhatsApp ↗</strong>
        </div>
      </a>
    </div>
  );
}
