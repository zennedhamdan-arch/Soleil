import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import sharp from 'sharp';
import {
  venuePhotos,
  isBundledVenuePhoto,
  isEnhancedVenuePhoto,
  resolveVenueImage,
  originalVenueImage,
  venueImageReplacements,
} from '../lib/venue-photos';
import { gallerySchema, serviceSchema } from '../lib/validation';

describe('selected image replacements and provenance', () => {
  it('serves eight optimized derivatives with unique stable IDs and no enlargement', async () => {
    expect(venuePhotos).toHaveLength(8);
    expect(new Set(venuePhotos.map((p) => p.id)).size).toBe(8);
    for (const photo of venuePhotos) {
      const file = new URL(`../public${photo.image_url}`, import.meta.url);
      const image = await sharp(readFileSync(file)).metadata();
      expect(image.format).toBe('webp');
      expect(Math.min(image.width!, image.height!)).toBeGreaterThanOrEqual(848);
      expect(statSync(file).size).toBeLessThan(300 * 1024);
      const name = photo.image_url.split('/').at(-1)!.replace('.webp', '.png');
      const source = await sharp(
        readFileSync(new URL(`../design/ai-previews/${name}`, import.meta.url)),
      ).metadata();
      expect([image.width, image.height]).toEqual([source.width, source.height]);
    }
  });
  it('maps every old database URL to its derivative and preserves originals for comparison', async () => {
    for (const [oldUrl, newUrl] of Object.entries(venueImageReplacements)) {
      expect(resolveVenueImage(oldUrl)).toBe(newUrl);
      expect(resolveVenueImage(newUrl)).toBe(newUrl);
      expect(isEnhancedVenuePhoto(oldUrl)).toBe(true);
      expect(originalVenueImage(newUrl)).toBe(oldUrl);
      const image = await sharp(
        readFileSync(new URL(`../public${oldUrl}`, import.meta.url)),
      ).metadata();
      expect(image.width).toBe(163);
    }
  });
  it('prefers a landscape garden hero and upgrades legacy editor values on save', () => {
    expect(venuePhotos[0].category).toBe('Garden');
    expect(
      gallerySchema.parse({ ...venuePhotos[0], image_url: '/images/soleil/venue-7.jpg' }).image_url,
    ).toBe(venuePhotos[0].image_url);
    expect(
      serviceSchema.safeParse({
        name: 'Wedding',
        slug: 'wedding',
        description: 'A garden wedding setting.',
        image_url: venuePhotos[0].image_url,
        active: true,
      }).success,
    ).toBe(true);
  });
  it('leaves genuine custom uploads unchanged and never labels them AI-generated', () => {
    const url = 'https://project.supabase.co/storage/v1/object/public/venue/custom.webp';
    expect(resolveVenueImage(url)).toBe(url);
    expect(isEnhancedVenuePhoto(url)).toBe(false);
    expect(originalVenueImage(url)).toBeUndefined();
  });
  it('rejects arbitrary local paths, traversal, external image URLs and unapproved generated files', () => {
    for (const path of [
      '/etc/passwd',
      '/images/soleil/../../private.jpg',
      '/images/soleil/venue-100.jpg',
      '/design/ai-previews/garden-marquee.png',
      '/images/soleil/enhanced/unknown.webp',
      'https://untrusted.example/image.jpg',
    ]) {
      expect(isBundledVenuePhoto(path)).toBe(false);
      expect(gallerySchema.safeParse({ ...venuePhotos[0], image_url: path }).success).toBe(false);
    }
  });
});
