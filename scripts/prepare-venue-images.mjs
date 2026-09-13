import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
const names = [
  'garden-marquee',
  'wedding-walkway',
  'canopy-reception',
  'floral-celebration-backdrop',
  'table-settings',
  'marquee-at-night',
  'evening-garden',
  'venue-entrance',
];
await mkdir('public/images/soleil/enhanced', { recursive: true });
for (const name of names) {
  const source = `design/ai-previews/${name}.png`;
  const output = `public/images/soleil/enhanced/${name}.webp`;
  const metadata = await sharp(source).metadata();
  await sharp(source)
    .rotate()
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85, effort: 6 })
    .toFile(output);
  console.log(
    `${name}: ${metadata.width}×${metadata.height} | ${Math.round((await stat(source)).size / 1024)} KB PNG → ${Math.round((await stat(output)).size / 1024)} KB WebP`,
  );
}
