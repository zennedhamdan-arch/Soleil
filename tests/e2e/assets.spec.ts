import { test, expect } from '@playwright/test';

for (const route of ['/', '/weddings', '/gallery', '/about', '/admin/login']) {
  test(`${route} uses optimized replacements without broken or legacy display images`, async ({
    page,
  }) => {
    await page.goto(route);
    const images = page.locator('main img');
    expect(await images.count()).toBeGreaterThan(0);
    for (const image of await images.all()) {
      if (!(await image.isVisible())) continue;
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate(
            (el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0,
          ),
        )
        .toBe(true);
      const src = await image.getAttribute('src');
      expect(decodeURIComponent(src!)).not.toMatch(/\/venue-\d+\.jpg/);
      expect(src).toContain('/_next/image?');
      expect(await image.getAttribute('sizes')).toBeTruthy();
      expect(await image.getAttribute('alt')).toContain('AI-enhanced');
      expect(await image.evaluate((el) => getComputedStyle(el).objectFit)).toBe('contain');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

test('hero uses the wide garden image and only one critical venue image is preloaded', async ({
  page,
}) => {
  await page.goto('/');
  const hero = page.locator('.hero-photo-main img');
  await expect(hero).toBeVisible();
  expect(decodeURIComponent((await hero.getAttribute('src'))!)).toContain(
    '/enhanced/garden-marquee.webp',
  );
  await expect(page.locator('.hero-photo-main .venue-image-disclosure')).toBeVisible();
  expect(await page.locator('link[rel="preload"][as="image"]').count()).toBe(1);
});

test('gallery displays provenance and retains the original only as an explicit source link', async ({
  page,
}) => {
  await page.goto('/gallery');
  await page.locator('.gallery-image-button').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.photo-provenance')).toContainText('recreated details may differ');
  await expect(dialog.getByRole('link', { name: 'View original source' })).toHaveAttribute(
    'href',
    '/images/soleil/venue-7.jpg',
  );
});

test('Next image endpoint returns a modern image format', async ({ request }) => {
  const response = await request.get(
    '/_next/image?url=%2Fimages%2Fsoleil%2Fenhanced%2Fgarden-marquee.webp&w=640&q=75',
    { headers: { Accept: 'image/avif,image/webp,image/*' } },
  );
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/image\/(avif|webp)/);
  expect((await response.body()).length).toBeLessThan(250 * 1024);
});
