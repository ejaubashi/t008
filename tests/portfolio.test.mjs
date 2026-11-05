import { test, expect } from '@playwright/test';

test('gallery filters, artwork details, and inquiry selection work', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A little wild.');
  await expect(page.locator('.art-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Abstract', exact: true }).click();
  await expect(page.locator('.art-card')).toHaveCount(2);
  await expect(page.locator('.result-count')).toHaveText('2 works');
  await page.getByRole('button', { name: 'Wildlife', exact: true }).click();
  await expect(page.locator('.art-card')).toHaveCount(3);
  await page.locator('.art-card').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Inquire about this piece' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByLabel('What are you imagining?')).toContainText('A moment of stillness');
  await page.getByRole('button', { name: 'All work' }).click();
  await page.locator('.art-card').first().click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.art-card').first()).toBeFocused();
});

test('inquiry downloads a draft with entered details', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/#contact');
  await page.getByLabel('Your name').fill('Test Visitor');
  await page.getByLabel('Email address').fill('visitor@example.com');
  await page.getByLabel('What are you imagining?').fill('An outdoor sculpture for a garden.');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save inquiry' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('sculpture-inquiry.txt');
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString()).toContain('An outdoor sculpture for a garden.');
  await expect(page.getByRole('status')).toContainText('does not send messages');
});

test('mobile navigation, gallery, and image assets work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:5173');
  await page.getByRole('button', { name: 'Menu +' }).click();
  await expect(page.getByRole('navigation')).toBeVisible();
  await page.getByRole('link', { name: 'The artist', exact: true }).click();
  await expect(page.getByRole('navigation')).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.art-card').first().scrollIntoViewIfNeeded();
  await page.locator('.art-card').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close artwork details' }).click();
  await page.locator('footer').scrollIntoViewIfNeeded();
  const brokenImages = await page.locator('img').evaluateAll(images => images.filter(i => i.complete && i.naturalWidth === 0).map(i => i.src));
  expect(brokenImages).toEqual([]);
});
