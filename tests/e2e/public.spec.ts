import { test, expect } from '@playwright/test';
for (const path of ['/', '/events', '/weddings', '/gallery', '/about', '/contact', '/reserve']) {
  test(`public page ${path} renders without errors or horizontal overflow`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}
test('hero, enquiry link, phone and WhatsApp work', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Celebrate YourMoments atSoleil Garden',
  );
  await expect(
    page.getByRole('link', { name: 'Chat with Soleil Garden on WhatsApp' }),
  ).toHaveAttribute('href', /^https:\/\/wa.me\/250790009264\?text=/);
  await expect(page.locator('a[href="tel:+250790009264"]').first()).toBeVisible();
  await page.locator('.hero-actions').getByRole('link', { name: 'Plan Your Event' }).click();
  await expect(page).toHaveURL(/\/reserve$/);
});
test('admin routes are protected', async ({ page }) => {
  for (const path of [
    '/admin',
    '/admin/bookings',
    '/admin/calendar',
    '/admin/blocked-dates',
    '/admin/gallery',
    '/admin/services',
    '/admin/settings',
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login$/);
  }
  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
});
test('cross-origin API mutations are rejected', async ({ request }) => {
  for (const path of ['/api/enquiries', '/api/admin', '/api/auth/login', '/api/auth/logout']) {
    const r = await request.post(path, {
      headers: { Origin: 'https://untrusted.example' },
      data: {},
    });
    expect(r.status()).toBe(403);
  }
});
test('calendar API rejects malformed ranges', async ({ request }) => {
  const r = await request.get('/api/availability?start=bad&end=2026-09-13');
  expect(r.status()).toBe(400);
});
test('mobile menu supports navigation', async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Mobile navigation' })
    .getByRole('link', { name: 'Events' })
    .click();
  await expect(page).toHaveURL(/\/events$/);
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
});

test('same-origin booking requests reach server validation', async ({ request, baseURL }) => {
  const response = await request.post('/api/enquiries', {
    headers: { Origin: baseURL! },
    data: {},
  });
  expect(response.status()).toBe(400);
});

test('supplied photographs load and the gallery viewer supports keyboard navigation', async ({
  page,
}) => {
  await page.goto('/gallery');
  const photographs = page.locator('.gallery-image-button');
  await expect(photographs).toHaveCount(8);
  await photographs.first().click();
  const viewer = page.getByRole('dialog');
  await expect(viewer).toBeVisible();
  const firstTitle = await viewer.locator('h2').textContent();
  await page.keyboard.press('ArrowRight');
  await expect(viewer.locator('h2')).not.toHaveText(firstTitle!);
  await page.keyboard.press('ArrowLeft');
  await expect(viewer.locator('h2')).toHaveText(firstTitle!);
  await page.keyboard.press('Escape');
  await expect(viewer).not.toBeVisible();
  await expect(photographs.first()).toBeFocused();
  await page
    .locator('.gallery-toolbar')
    .getByRole('link', { name: 'Weddings', exact: true })
    .click();
  await expect(page.locator('.gallery-image-button')).toHaveCount(2);
  const broken = await page
    .locator('main img')
    .evaluateAll((images) =>
      images.some(
        (image) =>
          !(image as HTMLImageElement).complete || (image as HTMLImageElement).naturalWidth === 0,
      ),
    );
  expect(broken).toBe(false);
});
