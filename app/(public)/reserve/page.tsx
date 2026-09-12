import { MessageCircle, Phone, Leaf, Check } from 'lucide-react';
import { getServices, getSettings, whatsapp } from '@/lib/data';
import { PageHeading } from '@/components/public-ui';
import { ReservationForm } from '@/components/reservation-form';
import { Button } from '@/components/ui/button';
export const metadata = {
  title: 'Plan Your Event · Reservation Enquiry',
  description:
    'Choose your event type, check live date availability and send an event enquiry to Soleil Garden Kigali.',
};
export default async function Reserve({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const [services, s, params] = await Promise.all([getServices(), getSettings(), searchParams]);
  return (
    <div className="container">
      <PageHeading
        eyebrow="Plan your event"
        title="Let’s make a beautiful moment."
        description="Tell us a little about your occasion. We’ll review your enquiry and get in touch to bring the next steps into focus."
      />
      <div className="reserve-layout">
        <ReservationForm services={services} initialEvent={params.event || ''} />
        <aside className="reserve-aside">
          <div className="panel soft-section">
            <Leaf size={30} strokeWidth={1} />
            <h3 className="mt-5">A little help along the way.</h3>
            <p className="text-xs mb-5">
              Have questions before you begin? We’re just a message away.
            </p>
            <Button variant="outline" asChild className="w-full">
              <a href={whatsapp(s.whatsapp)} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={15} />
                Continue on WhatsApp
              </a>
            </Button>
            <a
              href={`tel:${s.phone.replace(/\s/g, '')}`}
              className="flex items-center justify-center gap-2 mt-4 text-xs"
            >
              <Phone size={13} />
              {s.phone}
            </a>
            <hr className="border-[var(--border)] my-6" />
            <h4 className="text-xs mb-4">What happens next?</h4>
            {[
              'Send your event enquiry.',
              'Receive your unique reference.',
              'Our team reviews your request.',
              'We contact you to discuss your plans.',
            ].map((t) => (
              <div key={t} className="flex items-start gap-2 text-[11px] mb-3 text-[#727c64]">
                <Check size={12} className="mt-1" />
                {t}
              </div>
            ))}
            <p className="text-[10px] mt-5">
              Submitting an enquiry or messaging on WhatsApp does not confirm a reservation.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
