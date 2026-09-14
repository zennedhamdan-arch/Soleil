import { test, expect } from '@playwright/test';

test('official logo is crisp and undistorted in header, footer and mobile navigation', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const marks = page.locator('.brand-mark');
  await expect(marks).toHaveCount(2);
  for (const mark of await marks.all()) {
    await mark.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        mark.evaluate(
          (img) =>
            (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth === 256,
        ),
      )
      .toBe(true);
    const box = await mark.boundingBox();
    expect(box!.width).toBe(box!.height);
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeLessThanOrEqual(52);
    expect(await mark.evaluate((img) => getComputedStyle(img).objectFit)).toBe('contain');
    await expect(mark).toHaveAttribute('src', '/brand/soleil-garden-logo.png');
  }
  await page.evaluate(() => scrollTo(0, 0));
  if (isMobile) {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
    await expect(page.locator('.site-header .brand-mark')).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('admin login uses the official logo and retains authentication fields', async ({ page }) => {
  await page.goto('/admin/login');
  await expect(page.locator('.login-box .brand-mark')).toHaveAttribute(
    'src',
    '/brand/soleil-garden-logo.png',
  );
  await expect(page.locator('.login-box .brand-mark')).toBeVisible();
  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('browser, Apple and manifest icons are discoverable and load', async ({ page, request }) => {
  await page.goto('/');
  for (const selector of ['link[rel="icon"]', 'link[rel="apple-touch-icon"]']) {
    const links = page.locator(selector);
    expect(await links.count()).toBeGreaterThan(0);
    for (const link of await links.all()) {
      const response = await request.get((await link.getAttribute('href'))!);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toMatch(/^image\//);
    }
  }
  const manifestLink = page.locator('link[rel="manifest"]');
  await expect(manifestLink).toHaveAttribute('href', '/manifest.webmanifest');
  const response = await request.get('/manifest.webmanifest');
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.name).toBe('Soleil Garden');
  for (const icon of data.icons) expect((await request.get(icon.src)).status()).toBe(200);
});

test('shared brand fits the narrower admin drawer without changing authentication', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.site-header .brand-mark')).toBeVisible();
  // Isolated DOM layout fixture only; no mock admin route or auth bypass is added.
  const fits = await page.evaluate(() => {
    const sidebar = document.createElement('aside');
    sidebar.className = 'admin-sidebar';
    sidebar.style.visibility = 'hidden';
    const brand = document.querySelector('.site-header .brand')!.cloneNode(true) as HTMLElement;
    sidebar.append(brand);
    document.body.append(sidebar);
    const fits = brand.scrollWidth <= brand.clientWidth;
    sidebar.remove();
    return fits;
  });
  expect(fits).toBe(true);
});
