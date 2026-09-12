import type { GalleryImage } from './types';

/**
 * Owner-supplied JPGs copied byte-for-byte from origin/main (9ef58ad).
 * These are real photographs, not demo data. Database content takes precedence
 * once Supabase is connected. See docs/PHOTOGRAPHS.md for source dimensions.
 */
export const venuePhotos: GalleryImage[] = [
  {
    id: 'a18ed201-0000-4000-8000-000000000012',
    image_url: '/images/soleil/venue-12.jpg',
    title: 'A walkway framed with white drapes and flowers',
    category: 'Weddings',
    sort_order: 0,
    active: true,
  },
  {
    id: 'a18ed201-0000-4000-8000-000000000007',
    image_url: '/images/soleil/venue-7.jpg',
    title: 'The garden and marquee in daylight',
    category: 'Garden',
    sort_order: 1,
    active: true,
  },
  {
    id: 'a18ed201-0000-4000-8000-000000000004',
    image_url: '/images/soleil/venue-4.jpg',
    title: 'Tables arranged beneath a softly lit canopy',
    category: 'Celebrations',
    sort_order: 2,
    active: true,
  },
  {
    id: 'a18ed201-0000-4000-8000-000000000008',
    image_url: '/images/soleil/venue-8.jpg',
    title: 'A floral celebration backdrop with woven chairs',
    category: 'Weddings',
    sort_order: 3,
    active: true,
  },
  {
    id: 'a18ed201-0000-4000-8000-000000000006',
    image_url: '/images/soleil/venue-6.jpg',
    title: 'White table settings with orange accents',
    category: 'Celebrations',
    sort_order: 4,
    active: true,
  },
  {
    id: 'a18ed201-0000-4000-8000-000000000005',
    image_url: '/images/soleil/venue-5.jpg',
    title: 'The marquee illuminated in the evening',
    category: 'Garden',
    sort_order: 5,
    active: true,
  },
  {
    id: 'a18ed201-0000-4000-8000-000000000009',
    image_url: '/images/soleil/venue-9.jpg',
    title: 'An evening view across the garden lawn',
    category: 'Garden',
    sort_order: 6,
    active: true,
  },
  {
    id: 'a18ed201-0000-4000-8000-000000000010',
    image_url: '/images/soleil/venue-10.jpg',
    title: 'Tiled steps leading to the venue entrance',
    category: 'Other',
    sort_order: 7,
    active: true,
  },
];

const paths = new Set(venuePhotos.map((image) => image.image_url));
export function isBundledVenuePhoto(path: string) {
  return paths.has(path);
}
