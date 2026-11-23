import { test, expect } from '@playwright/test';

const site = 'http://127.0.0.1:5173/';
const viewportSizes = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];

for (const viewport of viewportSizes) {
  test(`the spotlight trades a readable painting and its palette at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(site);

    const gallery = page.getByRole('region', { name: 'Vortex artwork gallery' });
    const wash = gallery.locator('.vortex-light');
    const first = gallery.getByRole('link', { name: 'The Heath under Storm by Jack Wolfstein' });
    const next = gallery.getByRole('link', { name: 'Approaching Weather by Jack Wolfstein' });

    await expect(gallery.locator('.vortex-scene')).toHaveCSS('opacity', '1');
    await expect(wash).toHaveCSS('--vortex-wash', 'rgb(121, 100, 61)');
    const opening = await first.boundingBox();
    expect(opening.width).toBeGreaterThan(viewport.width * (viewport.width < 650 ? 0.55 : 0.3));
    expect(Math.abs(opening.x + opening.width / 2 - viewport.width / 2)).toBeLessThan(12);

    await gallery.focus();
    await page.keyboard.press('ArrowDown');
    await expect(wash).toHaveCSS('--vortex-wash', 'rgb(103, 114, 120)');
    const arrived = await next.boundingBox();
    expect(Math.abs(arrived.x + arrived.width / 2 - viewport.width / 2)).toBeLessThan(viewport.width * 0.05);
    expect(arrived.width).toBeGreaterThan((await first.boundingBox()).width * 1.5);

    await page.getByRole('button', { name: 'Reset view' }).click();
    await expect(wash).toHaveCSS('--vortex-wash', 'rgb(121, 100, 61)');
    await first.click();
    await expect(page).toHaveURL(/#\/work\/wolfstein\/heath-under-storm$/);
  });
}

test('automatic travel passes the spotlight to the next painting', async ({ page }) => {
  await page.goto(site);
  const gallery = page.getByRole('region', { name: 'Vortex artwork gallery' });
  const wash = gallery.locator('.vortex-light');

  await expect(wash).toHaveCSS('--vortex-wash', 'rgb(121, 100, 61)');
  await expect(wash).toHaveCSS('--vortex-wash', 'rgb(103, 114, 120)', { timeout: 8000 });
});
