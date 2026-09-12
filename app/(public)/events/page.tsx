import { PageHeading, ServiceCards, EventCTA } from '@/components/public-ui';
import { getServices } from '@/lib/data';
export const metadata = {
  title: 'Events & Celebrations',
  description:
    'Explore wedding, corporate, birthday, baby shower and other event enquiries at Soleil Garden Kigali.',
};
export default async function Events() {
  const services = await getServices();
  return (
    <div className="container">
      <PageHeading
        eyebrow="Our events"
        title="Every occasion deserves its moment."
        description="Big milestones. New beginnings. Simple reasons to be together. Find your occasion and start a conversation with Soleil Garden."
      />
      <ServiceCards services={services} />
      <section className="section">
        <EventCTA />
      </section>
    </div>
  );
}
