import sharp from 'sharp';
import { mkdir, writeFile, stat } from 'node:fs/promises';

// Official owner-provided artwork. Do not redraw, recolour, generatively enhance,
// threshold its transparency, or overwrite this full-resolution source.
const source = 'public/images/soleil/soleil-garden.png';
await mkdir('public/brand', { recursive: true });
await sharp(source)
  .resize(256, 256, { fit: 'contain', withoutEnlargement: true })
  .png({ compressionLevel: 9 })
  .toFile('public/brand/soleil-garden-logo.png');

async function appIcon(size) {
  const padding = Math.max(1, Math.round(size * 0.065));
  const inset = size - 2 * padding;
  const logo = await sharp(source).resize(inset, inset, { fit: 'contain' }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: '#233d30' } })
    .composite([{ input: logo, left: padding, top: padding }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}
for (const [size, file] of [
  [192, 'public/brand/icon-192.png'],
  [512, 'public/brand/icon-512.png'],
  [512, 'app/icon.png'],
  [180, 'app/apple-icon.png'],
]) {
  await writeFile(file, await appIcon(size));
}
// ICO directory with lossless PNG frames supported by modern browsers.
const sizes = [16, 32, 48, 64];
const frames = await Promise.all(sizes.map(appIcon));
const header = Buffer.alloc(6 + 16 * frames.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((frame, i) => {
  const entry = 6 + i * 16;
  header[entry] = sizes[i];
  header[entry + 1] = sizes[i];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(frame.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
});
await writeFile('app/favicon.ico', Buffer.concat([header, ...frames]));
console.log(
  `Official transparent logo: 256×256, ${Math.round((await stat('public/brand/soleil-garden-logo.png')).size / 1024)} KB`,
);
console.log('Created 16/32/48/64px favicon, 180px Apple icon, and 192/512px app icons.');
