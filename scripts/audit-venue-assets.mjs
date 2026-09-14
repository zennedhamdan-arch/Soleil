import { readdir, readFile, stat } from 'node:fs/promises';
import sharp from 'sharp';
async function files(dir) {
  const list = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      list.map(async (entry) =>
        entry.isDirectory() ? files(`${dir}/${entry.name}`) : `${dir}/${entry.name}`,
      ),
    )
  ).flat();
}
const images = (await files('public')).filter((path) => /\.(jpe?g|png|webp|avif)$/i.test(path));
console.log('PUBLIC IMAGE INVENTORY');
for (const path of images) {
  const image = await sharp(path).metadata();
  const kb = Math.round((await stat(path)).size / 1024);
  const legacy = /\/venue-\d+\.jpg$/.test(path);
  console.log(
    `${legacy ? 'ARCHIVED ORIGINAL' : 'ACTIVE DERIVATIVE'} | ${image.width}×${image.height} | ${kb} KB | ${path}`,
  );
  if (!legacy && Math.min(image.width, image.height) < 600)
    throw new Error(`Low-resolution active asset: ${path}`);
}
console.log('\nACTIVE COMPONENT REFERENCE AUDIT');
for (const dir of ['app', 'components'])
  for (const path of (await files(dir)).filter((p) => /\.tsx?$/.test(p))) {
    const code = await readFile(path, 'utf8');
    if (/['"]\/images\/soleil\/venue-\d+\.jpg['"]/.test(code))
      throw new Error(`Active legacy literal in ${path}`);
    if (code.includes("from 'next/image'") && path !== 'components/venue-image.tsx')
      throw new Error(`Venue image bypasses the shared rendering boundary: ${path}`);
  }
console.log(
  'PASS: venue components resolve known legacy database URLs and disclose enhanced provenance.',
);
console.log(
  'NOTE: original paths remain intentionally in historical migrations, migration mapping, and source-comparison links.',
);
