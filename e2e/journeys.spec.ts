import { test, expect, type Page } from '@playwright/test';

/** No DataTables error should ever surface as a blocking dialog (e.g. an XSS alert). */
test.beforeEach(async ({ page }) => {
  page.on('dialog', (d) => {
    throw new Error(`Unexpected dialog (${d.type()}): ${d.message()}`);
  });
});

async function infoText(page: Page): Promise<string> {
  return (await page.locator('.dt-info').first().innerText()).trim();
}

test('basic table: loads, sorts, and searches', async ({ page }) => {
  await page.goto('/');
  const rows = page.locator('table.dataTable tbody tr');
  await expect(rows).toHaveCount(10);
  await expect(page.locator('.dt-info').first()).toContainText('of 57 entries');

  // Sort by Name (column header 2) and confirm order changes.
  const firstBefore = await rows.first().innerText();
  await page.locator('table.dataTable thead th', { hasText: 'Name' }).click();
  await expect.poll(async () => rows.first().innerText()).not.toBe(firstBefore);

  // Global search narrows the result set.
  await page.locator('.dt-search input').fill('London');
  await expect(page.locator('.dt-info').first()).toContainText('filtered from 57');
});

test('row click surfaces typed row data', async ({ page }) => {
  await page.goto('/');
  await page.locator('table.dataTable tbody tr').first().click();
  await expect(page.getByTestId('row-click-note')).toContainText('Last clicked:');
});

test('selection: clicking rows updates the selected() signal', async ({ page }) => {
  await page.goto('/features/selection');
  await page.locator('table.dataTable tbody tr').first().click();
  await expect(page.getByTestId('selection-summary')).toContainText('Selected 1 row');
  await page.locator('table.dataTable tbody tr').nth(2).click();
  // 'multi' style accumulates selection.
  await expect(page.getByTestId('selection-summary')).toContainText('Selected 2 row');
});

test('filtering: per-column search reduces the result set', async ({ page }) => {
  await page.goto('/features/filtering');
  const info = page.locator('.dt-info').first();
  const before = await info.innerText();
  await page.getByTestId('col-search-2').fill('London'); // Office column
  await expect(info).not.toHaveText(before);
  await expect(info).toContainText('filtered from 57');
});

test('custom plugin: range slider re-filters via DataTable.ext.search', async ({ page }) => {
  await page.goto('/ext/plugin');
  const info = page.locator('.dt-info').first();
  const fullText = await info.innerText();
  expect(fullText).toContain('of 57');
  // Raise the minimum age — far fewer rows should remain. Range inputs ignore fill(),
  // so set the value and dispatch the input event the component listens for.
  const slider = page.getByTestId('min-age');
  await slider.evaluate((el: HTMLInputElement) => {
    el.value = '60';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  // The plugin filters to the few rows with age >= 60 → DataTables shows a "filtered from 57" note.
  await expect(info).toContainText('filtered from 57');
});

test('data reload: reassigning the data signal updates the table with no manual trigger', async ({
  page,
}) => {
  await page.goto('/data/live-reload');
  const info = page.locator('.dt-info').first();
  const before = await info.innerText();
  await page.getByTestId('add-row').click();
  await expect(info).not.toHaveText(before);
});

test('styling adapters render under each theme', async ({ page }) => {
  for (const path of ['styling/dt', 'styling/bs5', 'styling/tailwind', 'styling/material']) {
    await page.goto(`/${path}`);
    await expect(page.locator('table.dataTable tbody tr').first()).toBeVisible();
    await expect(page.getByTestId('styling-title')).toBeVisible();
  }
});
