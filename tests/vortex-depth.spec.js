import { test, expect } from '@playwright/test';

const output = 'work/previews';
for (const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
 test(`vortex repeats paintings to subpixel depth at ${viewport.width}px`, async ({page}) => {
  await page.setViewportSize(viewport);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(() => {
   const draw = CanvasRenderingContext2D.prototype.drawImage;
   const clear = CanvasRenderingContext2D.prototype.clearRect;
   CanvasRenderingContext2D.prototype.clearRect = function(...args) {
    window.paintingSizes = [];
    return clear.apply(this,args);
   };
   CanvasRenderingContext2D.prototype.drawImage = function(...args) {
    window.paintingSizes.push(args[3]);
    return draw.apply(this,args);
   };
  });
  await page.goto('http://127.0.0.1:5173/');
  await expect(page.getByRole('status',{name:'Loading gallery'})).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => window.paintingSizes?.length)).toBe(105);
  const sizes = await page.evaluate(() => window.paintingSizes);
  expect(Math.min(...sizes)).toBeLessThan(0.2);
  expect(Math.max(...sizes)).toBeGreaterThan(viewport.width < 650 ? 100 : 250);
  await expect(page.locator('.vortex-work')).toHaveCount(15);
  await expect(page.getByRole('link',{name:'Endi Jaubashi Art gallery home'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Resume motion',exact:true})).toBeVisible();
  await page.screenshot({path:`${output}/vortex-${viewport.width}.png`});
 });
}
