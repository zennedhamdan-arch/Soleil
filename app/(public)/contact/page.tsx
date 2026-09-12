import Link from 'next/link';
import { Phone, MapPin, MessageCircle, ArrowUpRight } from 'lucide-react';
import { getSettings, whatsapp } from '@/lib/data';
import { PageHeading } from '@/components/public-ui';
import { Button } from '@/components/ui/button';
export const metadata = {
  title: 'Contact & Location',
  description:
    'Contact Soleil Garden at +250 790 009 264. Visit us in Gikondo / KK35 Avenue, Kigali, Rwanda, or enquire on WhatsApp.',
};
export default async function Contact() {
  const s = await getSettings();
  return (
    <div className="container pb-20">
      <PageHeading
        eyebrow="Let’s connect"
        title="Beautiful moments start with hello."
        description="Have a date in mind, a question about the garden or an occasion to plan? We’d love to hear from you."
      />
      <div className="two-col">
        <div className="panel">
          <h3>Get in touch</h3>
          <div className="contact-list">
            <a href={`tel:${s.phone.replace(/\s/g, '')}`}>
              <span className="eyebrow">
                <Phone size={15} />
                Call Soleil Garden
              </span>
              <span className="serif text-2xl">{s.phone}</span>
            </a>
            <a href={whatsapp(s.whatsapp)} target="_blank" rel="noopener noreferrer">
              <span className="eyebrow">
                <MessageCircle size={16} />A conversation on WhatsApp
              </span>
              <span>Say hello to our team ↗</span>
            </a>
            <div>
              <span className="eyebrow">
                <MapPin size={16} />
                Find the garden
              </span>
              <p>{s.address}</p>
              <a
                className="text-link"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Soleil Garden ' + s.address)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Search on Google Maps <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>
        <div className="panel soft-section">
          <div className="eyebrow">Something to celebrate?</div>
          <h2>
            Tell us about
            <br />
            your next event.
          </h2>
          <p className="my-6">
            Choose your event type, check the date calendar and send us your details. We’ll review
            your enquiry and contact you to discuss the next steps.
          </p>
          <Button asChild>
            <Link href="/reserve">
              Plan Your Event <ArrowUpRight size={14} />
            </Link>
          </Button>
          <p className="mt-6 text-xs">
            Please contact us before visiting so we can discuss your plans. WhatsApp conversations
            and enquiries do not confirm a reservation.
          </p>
        </div>
      </div>
    </div>
  );
}
