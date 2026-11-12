import { expect, test, type Page } from '@playwright/test';
import { PNG } from 'pngjs';

/**
 * Smoke test: the game loads, draws, plays a card, pauses and resumes, and carries on from a save.
 * Runs on desktop and phone viewports (see playwright.config.ts).
 */

const errorsOf = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
};

/** The canvas shows a picture, not a flat colour: enough distinct tones across a sample of pixels. */
async function canvasDraws(page: Page): Promise<boolean> {
  const shot = await page.locator('canvas').first().screenshot();
  const png = PNG.sync.read(shot);
  const tones = new Set<number>();
  for (let i = 0; i < png.data.length; i += 4 * 97) tones.add((png.data[i] >> 4) * 256 + (png.data[i + 1] >> 4) * 16 + (png.data[i + 2] >> 4));
  return tones.size > 40;
}

async function startJourney(page: Page): Promise<void> {
  await page.goto('/?debug');
  await page.evaluate(() => localStorage.removeItem('immigrant-journey-v1'));
  await page.waitForFunction(() => Boolean((window as unknown as { __immigrant?: unknown }).__immigrant));
  await page.evaluate(() => (window as unknown as { __immigrant: { quickStart(p?: object): void } }).__immigrant.quickStart({ status: 'F1' }));
  await expect(page.locator('.card-main h2')).toBeVisible({ timeout: 15_000 });
}

test('title screen loads and the scene draws', async ({ page }) => {
  const errors = errorsOf(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'IMMIGRANT' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Start a/ })).toBeVisible();
  await page.waitForTimeout(2500);
  expect(await canvasDraws(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('a card plays: choose, see the result, move on', async ({ page }) => {
  const errors = errorsOf(page);
  await startJourney(page);
  const first = await page.locator('.card-main h2').textContent();
  await page.locator('[data-act="choose"]').first().click();
  await expect(page.locator('[data-act="continue"]')).toBeVisible();
  await page.locator('[data-act="continue"]').click();
  // Either an evening to spend or the next card.
  const evening = page.locator('[data-act="activity"]').first();
  if (await evening.isVisible().catch(() => false)) {
    await evening.click();
    await page.locator('#skip-btn').evaluate((b) => b.removeAttribute('hidden'));
    await page.locator('#skip-btn').click();
    await page.locator('[data-act="interlude-done"]').click();
  }
  await expect(page.locator('.card-main h2')).not.toHaveText(first ?? '', { timeout: 15_000 });
  expect(await canvasDraws(page)).toBe(true);
  expect(errors).toEqual([]);
});

test('pause freezes the scene and continue resumes it', async ({ page }) => {
  await startJourney(page);
  await page.locator('[data-act="pause"]').click();
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
  const clock = (): Promise<number> => page.evaluate(() => (window as unknown as { __immigrant: { scene: { clockT: number } } }).__immigrant.scene.clockT);
  const a = await clock();
  await page.waitForTimeout(800);
  expect(await clock()).toBe(a);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeHidden();
  await page.waitForTimeout(500);
  expect(await clock()).toBeGreaterThan(a);
});

test('the journey is saved and carries on after a reload', async ({ page }) => {
  await startJourney(page);
  const title = await page.locator('.card-main h2').textContent();
  await page.goto('/');
  const resume = page.getByRole('button', { name: /Continue your journey/ });
  await expect(resume).toBeVisible();
  await resume.click();
  await expect(page.locator('.card-main h2')).toHaveText(title ?? '', { timeout: 15_000 });
});
