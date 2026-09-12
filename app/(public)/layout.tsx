import Link from 'next/link';
import { MapPin, Phone, MessageCircle, ArrowUpRight } from 'lucide-react';
import { Header } from '@/components/header';
import { Brand } from '@/components/brand';
import { ContactStrip } from '@/components/public-ui';
import { getSettings, whatsapp } from '@/lib/data';
export const dynamic = 'force-dynamic';
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: s.business_name,
    description: s.description,
    telephone: s.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Gikondo / KK35 Avenue',
      addressLocality: 'Kigali',
      addressCountry: 'RW',
    },
    ...(process.env.NEXT_PUBLIC_SITE_URL ? { url: process.env.NEXT_PUBLIC_SITE_URL } : {}),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="topbar">
        <div className="container">
          <span className="flex items-center gap-2">
            <MapPin size={11} /> Gikondo, Kigali · A place for beautiful moments
          </span>
          <a href={`tel:${s.phone.replace(/\s/g, '')}`}>
            <Phone size={10} />
            {s.phone}
          </a>
        </div>
      </div>
      <Header />
      <main id="main-content">{children}</main>
      <ContactStrip settings={s} />
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <Brand />
              <p>{s.description}</p>
            </div>
            <div>
              <h4>Discover</h4>
              <div className="footer-links">
                <Link href="/about">Our Garden</Link>
                <Link href="/events">Our Events</Link>
                <Link href="/weddings">Weddings</Link>
                <Link href="/gallery">Gallery</Link>
              </div>
            </div>
            <div>
              <h4>Let’s connect</h4>
              <div className="footer-links">
                <Link href="/reserve">Plan Your Event</Link>
                <Link href="/contact">Contact Us</Link>
                <a href={whatsapp(s.whatsapp)} target="_blank" rel="noopener noreferrer">
                  WhatsApp ↗
                </a>
                {Object.entries(s.social_links).map(([name, url]) => (
                  <a href={url} key={name} target="_blank" rel="noopener noreferrer">
                    {name} ↗
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4>Find your moment</h4>
              <p style={{ marginTop: 0 }}>{s.address}</p>
              <a className="text-link" href={`tel:${s.phone.replace(/\s/g, '')}`}>
                {s.phone}
                <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} {s.business_name}. All rights reserved.
            </span>
            <span>
              Thoughtfully gathered. Beautifully celebrated.{' '}
              <Link href="/admin" className="ml-4">
                Staff access
              </Link>
            </span>
          </div>
        </div>
      </footer>
      <a
        className="floating-whatsapp"
        href={whatsapp(s.whatsapp)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Soleil Garden on WhatsApp"
      >
        <MessageCircle size={21} />
        <span>Let’s talk</span>
      </a>
    </>
  );
}
