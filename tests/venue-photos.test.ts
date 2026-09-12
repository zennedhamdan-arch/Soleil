import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { venuePhotos, isBundledVenuePhoto } from '../lib/venue-photos';
import { gallerySchema, serviceSchema } from '../lib/validation';

describe('owner-supplied photographs', () => {
  it('has eight real JPEG assets with unique IDs and descriptive titles', async () => {
    expect(venuePhotos).toHaveLength(8);
    expect(new Set(venuePhotos.map((p) => p.id)).size).toBe(8);
    for (const photo of venuePhotos) {
      const bytes = readFileSync(new URL(`../public${photo.image_url}`, import.meta.url));
      const info = await sharp(bytes).metadata();
      expect(info.format).toBe('jpeg');
      expect(info.width).toBe(163);
      expect(photo.title.length).toBeGreaterThan(15);
    }
  });
  it('allows staff to save seeded local images without reuploading', () => {
    expect(gallerySchema.safeParse(venuePhotos[0]).success).toBe(true);
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
  it('rejects arbitrary local paths, traversal and foreign image URLs', () => {
    for (const path of [
      '/etc/passwd',
      '/images/soleil/../../private.jpg',
      '/images/soleil/venue-100.jpg',
      'https://untrusted.example/image.jpg',
    ]) {
      expect(isBundledVenuePhoto(path)).toBe(false);
      expect(gallerySchema.safeParse({ ...venuePhotos[0], image_url: path }).success).toBe(false);
    }
  });
});
