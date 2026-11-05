import { test, expect } from '@playwright/test';
const site='http://127.0.0.1:5173/';

test('vortex supports travel, rotation, reset, painting details and the original field',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(site);
 const gallery=page.getByRole('region',{name:'Vortex artwork gallery'});
 await expect(gallery).toBeVisible();
 await expect(page.getByRole('status',{name:'Loading gallery'})).not.toBeVisible();
 await expect(page.locator('.vortex-work')).toHaveCount(15);
 await page.getByRole('button',{name:'Pause motion',exact:true}).click();
 const resume=page.getByRole('button',{name:'Resume motion',exact:true});
 await expect(resume).toHaveAttribute('aria-pressed','true');
 const before=Number(await gallery.getAttribute('data-travel'));
 await page.mouse.move(1000,200);await page.mouse.wheel(0,400);
 await expect.poll(async()=>Number(await gallery.getAttribute('data-travel'))).toBeGreaterThan(before+0.05);
 // Dragging rotates the media and must not open a painting accidentally.
 const painting=page.locator('.vortex-work').nth(8);
 const previous=await painting.getAttribute('style');
 await page.mouse.move(900,600);await page.mouse.down();await page.mouse.move(1150,500,{steps:15});await page.mouse.up();
 await expect(page).toHaveURL(site);
 await expect.poll(()=>painting.getAttribute('style')).not.toBe(previous);
 await page.getByRole('button',{name:'Reset view',exact:true}).click();
 await expect.poll(async()=>Math.abs(Number(await gallery.getAttribute('data-travel')))).toBeLessThan(0.002);
 const first=page.getByRole('link',{name:'Before the Squall by Jack Wolfstein',exact:true});
 await first.focus();
 await expect.poll(async()=>(await first.boundingBox()).width).toBeGreaterThan(170);
 await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/#\/work\/wolfstein\/before-the-squall$/);
 await expect(page.locator('.detail-image img')).toHaveAttribute('alt','Before the Squall by Jack Wolfstein');
 await page.keyboard.press('Escape');await expect(gallery).toBeVisible();
 await expect(page.getByRole('button',{name:'Resume motion',exact:true})).toBeVisible();
 await page.getByRole('link',{name:'Field',exact:true}).click();
 await expect(page).toHaveURL(/#\/field$/);
 await expect(page.getByRole('region',{name:'Draggable artwork field'})).toBeVisible();
 await page.getByRole('link',{name:'Vortex',exact:true}).click();await expect(gallery).toBeVisible();
 await page.getByRole('link',{name:'List',exact:true}).click();
 await expect(page.getByRole('main',{name:'Index of works'})).toBeVisible();
 expect(errors).toEqual([]);
});

test('vortex respects reduced motion, fits mobile and supports touch exploration',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.goto(site);
 const gallery=page.getByRole('region',{name:'Vortex artwork gallery'});
 await expect(page.getByRole('button',{name:'Resume motion',exact:true})).toBeVisible();
 await expect(page.getByRole('status',{name:'Loading gallery'})).not.toBeVisible();
 const start=await gallery.getAttribute('data-travel');
 await page.waitForTimeout(180);expect(await gallery.getAttribute('data-travel')).toBe(start);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 // Use real browser touch input so gesture handling and click suppression are exercised.
 const touch=await context.newCDPSession(page);
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:400}]});
 for(const y of [370,340,310,280,250])await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:245,y}]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect.poll(async()=>Number(await gallery.getAttribute('data-travel'))).toBeGreaterThan(0.05);
 // Finish the browser's 300ms touch-gesture recognition before a separate tap.
 await page.waitForTimeout(350);
 await page.getByRole('link',{name:'Field',exact:true}).tap();
 await expect(page.getByRole('region',{name:'Draggable artwork field'})).toBeVisible();
 await context.close();
});
