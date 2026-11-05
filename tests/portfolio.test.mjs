import { test, expect } from '@playwright/test';

const site='http://127.0.0.1:5173/';

test('field renders reference paintings, supports pan and drag, and opens details',async({page})=>{
 await page.setViewportSize({width:1920,height:911});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(site);
 await expect(page.getByRole('status',{name:'Loading gallery'})).not.toBeVisible();
 const field=page.getByRole('region',{name:'Draggable artwork field'});
 const painting=page.getByRole('link',{name:'The Heath under Storm by Jack Wolfstein',exact:true});
 await expect(painting).toBeVisible();
 expect(await page.locator('canvas').evaluate(c=>[...c.getContext('2d').getImageData(900,500,1,1).data].slice(0,3))).not.toEqual([244,244,244]);
 const original=await painting.boundingBox();
 await page.mouse.move(600,300);await page.mouse.wheel(0,600);
 await expect.poll(async()=> (await painting.boundingBox()).y).toBeLessThan(original.y-200);
 await field.focus();await page.keyboard.press('Home');
 await expect.poll(async()=>Math.abs((await painting.boundingBox()).y-original.y)).toBeLessThan(2);
 const image=page.getByRole('link',{name:'Two Boats, Heavy Weather by Jack Wolfstein',exact:true});
 const beforeDrag=await image.boundingBox();
 await page.mouse.move(beforeDrag.x+70,beforeDrag.y+80);await page.mouse.down();
 await page.mouse.move(beforeDrag.x-180,beforeDrag.y-70,{steps:15});await page.mouse.up();
 await expect(page).toHaveURL(site);
 await expect.poll(async()=> (await image.boundingBox()).x).toBeLessThan(beforeDrag.x-100);
 await field.focus();await page.keyboard.press('Home');
 await expect.poll(async()=>Math.abs((await painting.boundingBox()).y-original.y)).toBeLessThan(2);
 await painting.click();
 await expect(page).toHaveURL(/#\/work\/wolfstein\/heath-under-storm$/);
 await expect(page.locator('.detail-image img')).toHaveAttribute('alt','The Heath under Storm by Jack Wolfstein');
 await page.keyboard.press('Escape');await expect(page.getByRole('region',{name:'Draggable artwork field'})).toBeVisible();
 expect(errors).toEqual([]);
});

test('list previews the selected work, switches artist, and opens and closes artwork',async({page})=>{
 await page.setViewportSize({width:1920,height:911});
 await page.goto(`${site}#/list`);
 await expect(page.locator('.index-row')).toHaveCount(27);
 await expect(page.getByRole('heading',{name:'Jack Wolfstein'})).toBeVisible();
 await page.getByRole('button',{name:'Preview The Heath under Storm',exact:true}).click();
 await expect(page.getByRole('button',{name:'Preview The Heath under Storm',exact:true})).toHaveAttribute('aria-pressed','true');
 const preview=page.getByRole('link',{name:'Open The Heath under Storm',exact:true});
 await expect.poll(async()=>Math.abs((await preview.boundingBox()).x-849.6)).toBeLessThan(2);
 await preview.click();await expect(page).toHaveURL(/heath-under-storm$/);
 await page.getByRole('link',{name:'Back to the gallery',exact:true}).click();
 await expect(page).toHaveURL(/#\/list$/);
 await page.getByRole('button',{name:'Preview Woman in a Black Scarf',exact:true}).click();
 await expect(page.getByRole('heading',{name:'River Cole'})).toBeVisible();
 await expect(page.getByRole('link',{name:'Open Woman in a Black Scarf',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Preview Festival in the Square',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Mira Lindqvist'})).toBeVisible();
 await expect(page.locator('.reference-unavailable')).toContainText('its image is not shown');
});

test('about, contact links, sound control and browser history work',async({page})=>{
 await page.goto(`${site}#/about`);
 await expect(page.getByRole('heading',{level:1})).toContainText('shows contemporary');
 await expect(page.locator('.gallery-facts')).toContainText('2009');
 await expect(page.locator('.gallery-facts')).toContainText('14 Marlow Yard, London E2');
 await page.getByRole('heading',{name:'The ground floor',exact:true}).scrollIntoViewIfNeeded();
 await expect(page.getByRole('heading',{name:'The ground floor',exact:true})).toBeVisible();
 await page.getByRole('link',{name:'contacts',exact:true}).click();
 await expect(page).toHaveURL(/#\/contacts$/);
 await expect(page.getByRole('link',{name:'contact us',exact:true})).toHaveAttribute('href','mailto:info@chriswilliamsart.com');
 await expect(page.getByRole('link',{name:'SALES@CHRISWILLIAMSART.COM',exact:true})).toHaveAttribute('href','mailto:sales@chriswilliamsart.com');
 const sound=page.getByRole('button',{name:'Toggle ambient sound'});
 await sound.click();await expect(sound).toHaveAttribute('aria-pressed','true');
 await sound.click();await expect(sound).toHaveAttribute('aria-pressed','false');
 await page.goBack();await expect(page.getByRole('heading',{level:1})).toContainText('shows contemporary');
});

test('mobile pages fit the viewport and recovered artwork assets load',async({page,request})=>{
 await page.setViewportSize({width:390,height:844});
 for(const route of ['/','/about','/contacts','/list','/work/cole/black-scarf']){
  await page.goto(`${site}#${route}`);
  await expect(page.getByRole('link',{name:'Chris Williams Art gallery home'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await expect(page.locator('.detail-image img')).toBeVisible();
 await page.getByRole('link',{name:'Back to the gallery',exact:true}).click();
 await expect(page).toHaveURL(/#\/list$/);
 await expect(page.getByRole('main',{name:'Index of works'})).toBeVisible();
 for(const number of [1,2,3,4,5,6,19,20,21,22,23,24,25,26,27]){
  const response=await request.get(`${site}paintings/${String(number).padStart(2,'0')}.webp`);
  expect(response.ok()).toBe(true);expect(response.headers()['content-type']).toContain('image/webp');
 }
});
