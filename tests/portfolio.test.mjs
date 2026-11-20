import { test, expect } from '@playwright/test';

const site = 'http://127.0.0.1:5173/';

test('the entry is the vortex and retired gallery links land there', async ({ page }) => {
  await page.goto(site);
  const gallery = page.getByRole('region', { name: 'Vortex artwork gallery' });
  await expect(gallery).toBeVisible();
  await expect(gallery.locator('.vortex-scene')).toHaveCSS('opacity', '1');
  await expect(page.getByRole('link', { name: 'Endi Jaubashi Art gallery home' })).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.getByText(/Art in orbit|Scroll to travel|Drag to spin/)).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Gallery controls' }).getByRole('button')).toHaveCount(3);

  for (const route of ['/field', '/list', '/vortex']) {
    await page.goto(`${site}#${route}`);
    await expect(page).toHaveURL(`${site}#/`);
    await expect(gallery).toBeVisible();
  }
});

test('direct about and contact links still work with browser history', async ({ page }) => {
  await page.goto(`${site}#/about`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('shows contemporary');
  await expect(page.locator('.gallery-facts')).toContainText('2009');
  await expect(page.locator('.gallery-facts')).toContainText('14 Marlow Yard, London E2');
  await page.getByRole('heading', { name: 'The ground floor', exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'The ground floor', exact: true })).toBeVisible();
  await page.goto(`${site}#/contacts`);
  await expect(page.getByRole('link', { name: 'contact us', exact: true })).toHaveAttribute('href', 'mailto:info@chriswilliamsart.com');
  await expect(page.getByRole('link', { name: 'SALES@CHRISWILLIAMSART.COM', exact: true })).toHaveAttribute('href', 'mailto:sales@chriswilliamsart.com');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('shows contemporary');
});

test('the gallery dock toggles sound', async ({ page }) => {
  await page.goto(site);
  const sound = page.getByRole('button', { name: 'Toggle ambient sound' });
  await sound.click();
  await expect(sound).toHaveAttribute('aria-pressed', 'true');
  await sound.click();
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
});

test('mobile pages fit the viewport and recovered artwork assets load', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/about', '/contacts', '/work/cole/black-scarf']) {
    await page.goto(`${site}#${route}`);
    await expect(page.getByRole('link', { name: 'Endi Jaubashi Art gallery home' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await expect(page.locator('.detail-image img')).toBeVisible();
  await page.getByRole('link', { name: 'Back to the gallery', exact: true }).click();
  await expect(page).toHaveURL(`${site}#/`);
  await expect(page.getByRole('region', { name: 'Vortex artwork gallery' })).toBeVisible();
  for (const number of [1, 2, 3, 4, 5, 6, 19, 20, 21, 22, 23, 24, 25, 26, 27]) {
    const response = await request.get(`${site}paintings/${String(number).padStart(2, '0')}.webp`);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/webp');
  }
});
