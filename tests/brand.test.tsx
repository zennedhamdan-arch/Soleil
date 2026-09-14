import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import sharp from 'sharp';
import { describe, it, expect } from 'vitest';
import { Brand } from '../components/brand';
import manifest from '../app/manifest';

const sourcePath = new URL('../public/images/soleil/soleil-garden.png', import.meta.url);
const logoPath = new URL('../public/brand/soleil-garden-logo.png', import.meta.url);

describe('official brand artwork', () => {
  it('preserves the owner-provided transparent full-resolution source', async () => {
    const source = readFileSync(sourcePath);
    // Git blob hash from origin/main, not a recreated approximation.
    const blob = createHash('sha1').update(`blob ${source.length}\0`).update(source).digest('hex');
    expect(blob).toBe('f83d31d51d03ea6ccbd1496d681e187dce8e5eb8');
    const info = await sharp(source).metadata();
    expect([info.width, info.height, info.hasAlpha]).toEqual([1254, 1254, true]);
  });
  it('uses a small lossless derivative without recolouring or changing geometry', async () => {
    const logo = await sharp(readFileSync(logoPath))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const expected = await sharp(readFileSync(sourcePath))
      .resize(256, 256, { fit: 'contain', withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer();
    expect(logo.data.equals(expected)).toBe(true);
    expect([logo.info.width, logo.info.height]).toEqual([256, 256]);
    expect(statSync(logoPath).size).toBeLessThan(60 * 1024);
    expect(logo.data[3]).toBe(0); // The transparent corner is not flattened onto a background.
  });
  it('renders the official mark in the shared brand, not the old Sun icon or AI venue renderer', () => {
    const html = renderToStaticMarkup(<Brand />);
    expect(html).toContain('/brand/soleil-garden-logo.png');
    expect(html).toContain('Soleil Garden official gold monogram');
    expect(html).toContain('width="52"');
    expect(html).toContain('height="52"');
    expect(html).not.toContain('<svg');
    expect(html).not.toContain('AI-enhanced');
    expect(html).toContain('aria-label="Soleil Garden home"');
  });
  it('creates correctly sized Apple and app icons from the same artwork', async () => {
    for (const [path, size] of [
      ['app/apple-icon.png', 180],
      ['app/icon.png', 512],
      ['public/brand/icon-192.png', 192],
      ['public/brand/icon-512.png', 512],
    ] as const) {
      const data = readFileSync(new URL(`../${path}`, import.meta.url));
      const info = await sharp(data).metadata();
      expect([info.width, info.height]).toEqual([size, size]);
      const stats = await sharp(data).stats();
      expect(stats.isOpaque).toBe(true);
    }
    expect(manifest().icons?.map((icon) => icon.sizes)).toEqual(['192x192', '512x512']);
  });
  it('ships a valid multi-resolution favicon instead of distorting the mark', async () => {
    const ico = readFileSync(new URL('../app/favicon.ico', import.meta.url));
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(4);
    for (const [index, size] of [16, 32, 48, 64].entries()) {
      const at = 6 + index * 16;
      const length = ico.readUInt32LE(at + 8),
        offset = ico.readUInt32LE(at + 12);
      const frame = await sharp(ico.subarray(offset, offset + length)).metadata();
      expect([ico[at], ico[at + 1], frame.width, frame.height]).toEqual([size, size, size, size]);
    }
  });
});
