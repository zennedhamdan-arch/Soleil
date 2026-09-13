import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { VenueImage } from '../components/venue-image';

describe('shared image rendering for public and admin records', () => {
  it('rewrites legacy database paths and labels the derivative', () => {
    const html = renderToStaticMarkup(
      <VenueImage src="/images/soleil/venue-4.jpg" alt="Event tables" fill sizes="33vw" />,
    );
    expect(html).toContain('canopy-reception.webp');
    expect(html).not.toContain('venue-4.jpg');
    expect(html).toContain('AI-enhanced image');
    expect(html).toContain('details may differ from the actual venue');
  });
  it('does not falsely label an unrelated authentic local image as generated', () => {
    const html = renderToStaticMarkup(
      <VenueImage
        src="/example-authentic.webp"
        alt="Verified photograph"
        width={1200}
        height={800}
      />,
    );
    expect(html).toContain('Verified photograph');
    expect(html).not.toContain('AI-enhanced');
  });
});
