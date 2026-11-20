import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`vortex projects upright paintings at different depths at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('http://127.0.0.1:5173/');
    await expect(page.getByRole('status', { name: 'Loading gallery' })).not.toBeVisible();

    const gallery = page.getByRole('region', { name: 'Vortex artwork gallery' });
    await expect(gallery.getByRole('link')).toHaveCount(15);
    await expect(page.getByRole('link', { name: 'Endi Jaubashi Art gallery home' })).toBeVisible();
    const panels = await gallery.getByRole('link').evaluateAll(links => links.map(link => {
      const style = getComputedStyle(link);
      const matrix = new DOMMatrix(style.transform);
      const bounds = link.getBoundingClientRect();
      return {
        z: matrix.m43,
        yaw: matrix.m13,
        opacity: Number(style.opacity),
        onScreen: bounds.right > 0 && bounds.left < innerWidth && bounds.bottom > 0 && bounds.top < innerHeight,
        loaded: link.querySelector('img').naturalWidth > 0,
      };
    }));

    expect(panels.every(panel => panel.loaded)).toBe(true);
    const visible = panels.filter(panel => panel.onScreen && panel.opacity > 0.15);
    expect(visible.some(panel => panel.z > 0)).toBe(true);
    expect(visible.some(panel => panel.z < 0)).toBe(true);
    expect(visible.some(panel => Math.abs(panel.yaw) > 0.5)).toBe(true);
    await expect(page.locator('.vortex-echo').first()).toHaveCSS('pointer-events', 'none');
    await expect(page.getByRole('button', { name: 'Resume motion', exact: true })).toBeVisible();
  });
}
