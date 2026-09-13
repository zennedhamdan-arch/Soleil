import type { GalleryImage } from './types';

/**
 * User-selected AI-enhanced derivatives from design/ai-previews.
 * Preserve provenance: these are not unaltered documentary photographs.
 * Originals remain available for comparison; database content takes precedence.
 */
export const venuePhotos: GalleryImage[] = [
  {
    id: 'a18ed201-0000-4000-8000-000000000012',
    image_url: '/images/soleil/enhanced/wedding-walkway.webp',
    title: 'A walkway framed with white drapes and flowers',
    category: 'Weddings',
    sort_order: 1,
    active: true,
  },
  {
    id: 'a18ed201-0000-4000-8000-000000000007',
    image_url: '/images/soleil/enhanced/garden-marquee.webp',
    title: 'The garden and marquee in daylight',
    category: 'Garden',
    sort_order: 0,
    active: true,
  },
  {
    id: 'a18ed201-0000-4000-8000-000000000004',
    image_url: '/images/soleil/enhanced/canopy-reception.webp',
    title: 'Tables arranged beneath a softly lit canopy',
    category: 'Celebrations',
    sort_order: 2,
    active: true,
  },
  {
    id: 'a18ed201-0000-4000-8000-000000000008',
    image_url: '/images/soleil/enhanced/floral-celebration-backdrop.webp',
    title: 'A floral celebration backdrop with woven chairs',
    category: 'Weddings',
    sort_order: 3,
    active: true,
  },
  {
    id: 'a18ed201-0000-4000-8000-000000000006',
    image_url: '/images/soleil/enhanced/table-settings.webp',
    title: 'White table settings with orange accents',
    category: 'Celebrations',
    sort_order: 4,
    active: true,
  },
  {
    id: 'a18ed201-0000-4000-8000-000000000005',
    image_url: '/images/soleil/enhanced/marquee-at-night.webp',
    title: 'The marquee illuminated in the evening',
    category: 'Garden',
    sort_order: 5,
    active: true,
  },
  {
    id: 'a18ed201-0000-4000-8000-000000000009',
    image_url: '/images/soleil/enhanced/evening-garden.webp',
    title: 'An evening view across the garden lawn',
    category: 'Garden',
    sort_order: 6,
    active: true,
  },
  {
    id: 'a18ed201-0000-4000-8000-000000000010',
    image_url: '/images/soleil/enhanced/venue-entrance.webp',
    title: 'Tiled steps leading to the venue entrance',
    category: 'Other',
    sort_order: 7,
    active: true,
  },
].sort((a, b) => a.sort_order - b.sort_order);

/** Only these eight legacy URLs may resolve to enhanced derivatives. */
export const venueImageReplacements: Readonly<Record<string, string>> = {
  '/images/soleil/venue-12.jpg': '/images/soleil/enhanced/wedding-walkway.webp',
  '/images/soleil/venue-7.jpg': '/images/soleil/enhanced/garden-marquee.webp',
  '/images/soleil/venue-4.jpg': '/images/soleil/enhanced/canopy-reception.webp',
  '/images/soleil/venue-8.jpg': '/images/soleil/enhanced/floral-celebration-backdrop.webp',
  '/images/soleil/venue-6.jpg': '/images/soleil/enhanced/table-settings.webp',
  '/images/soleil/venue-5.jpg': '/images/soleil/enhanced/marquee-at-night.webp',
  '/images/soleil/venue-9.jpg': '/images/soleil/enhanced/evening-garden.webp',
  '/images/soleil/venue-10.jpg': '/images/soleil/enhanced/venue-entrance.webp',
};
const paths = new Set(venuePhotos.map((image) => image.image_url));
export function resolveVenueImage(path: string): string {
  return venueImageReplacements[path] ?? path;
}
export function isBundledVenuePhoto(path: string) {
  return paths.has(resolveVenueImage(path));
}
export function isEnhancedVenuePhoto(path: string) {
  return paths.has(resolveVenueImage(path));
}
export function originalVenueImage(path: string): string | undefined {
  const resolved = resolveVenueImage(path);
  return Object.entries(venueImageReplacements).find(
    ([, replacement]) => replacement === resolved,
  )?.[0];
}
