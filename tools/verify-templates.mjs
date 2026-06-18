// One-off interaction check for the Angular-cell-templates feature: confirms a (click) handler
// updates state under zoneless CD, and that a cell routerLink does SPA navigation.
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://localhost:4292/features/templates';
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('table.dataTable tbody tr td .tpl-btn', { timeout: 20000 });

  // 1) (click) handler -> signal -> note appears (zoneless CD through an embedded view).
  await page.click('table tbody tr:first-child .tpl-btn');
  await page.waitForSelector('.tpl-note', { timeout: 5000 });
  console.log('NOTE after click:', JSON.stringify(await page.textContent('.tpl-note')));

  // 2) cell routerLink -> SPA navigation.
  const href = await page.getAttribute('table tbody tr:first-child .tpl-link', 'href');
  console.log('cell routerLink href:', href);
  await page.click('table tbody tr:first-child .tpl-link');
  await page.waitForFunction(() => location.pathname.endsWith('/basic'), { timeout: 5000 });
  console.log('URL after link click:', new URL(page.url()).pathname);

  console.log('CONSOLE_ERRORS', errors.length, errors.slice(0, 3));
} finally {
  await browser.close();
}
