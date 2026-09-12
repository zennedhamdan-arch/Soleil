import { PageHeading, VenueArt, EventCTA } from '@/components/public-ui';
import { getGallery } from '@/lib/data';
export const metadata = {
  title: 'About Our Garden',
  description:
    'Meet Soleil Garden, a garden wedding and event venue in Gikondo on KK35 Avenue, Kigali, Rwanda.',
};
export default async function About() {
  const images = await getGallery(1);
  return (
    <div className="container">
      <PageHeading
        eyebrow="Our garden"
        title="A place to gather. A reason to celebrate."
        description="Soleil Garden is a garden wedding and event venue in Gikondo, Kigali, Rwanda. A setting for the moments that bring us together."
      />
      <div className="two-col">
        <div className="relative min-h-[430px] rounded-t-full overflow-hidden">
          <VenueArt image={images[0]} />
        </div>
        <div className="panel self-center">
          <div className="eyebrow">Your moments matter</div>
          <h2>
            Life is better
            <br />
            celebrated together.
          </h2>
          <p className="mt-6">
            From weddings and engagements to birthdays, school events and corporate gatherings,
            Soleil Garden welcomes enquiries for many kinds of occasions.
          </p>
          <p className="mt-4">
            We believe the best place to start is a conversation. Tell us your plans and ask us
            about the details that are important to your event.
          </p>
          <p className="mt-4">
            Find us at Gikondo / KK35 Avenue, Kigali. Contact the team to arrange a visit or discuss
            your preferred date.
          </p>
        </div>
      </div>
      <section className="section">
        <EventCTA />
      </section>
    </div>
  );
}
