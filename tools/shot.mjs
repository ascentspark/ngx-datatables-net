/**
 * Isolated screenshot helper.
 *
 * Launches its OWN headless Chromium instance (via project-local @playwright/test), completely
 * independent of any other running browser. Use for visual verification of the demo.
 *
 * Usage:
 *   node tools/shot.mjs <url> <outPath> [waitSelector] [width] [height]
 */
import { chromium } from '@playwright/test';

const [, , url, out = 'shot.png', waitSelector = 'body', width = '1280', height = '1400'] =
  process.argv;

if (!url) {
  console.error('Usage: node tools/shot.mjs <url> <outPath> [waitSelector] [width] [height]');
  process.exit(1);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: Number(width), height: Number(height) },
    deviceScaleFactor: 2,
  });
  const consoleErrors = [];
  const dialogs = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
  // Capture dialogs (alert/confirm/prompt), a fired XSS alert() would surface here.
  page.on('dialog', async (dialog) => {
    dialogs.push(`${dialog.type()}: ${dialog.message()}`);
    await dialog.dismiss().catch(() => {});
  });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector(waitSelector, { timeout: 20000 });
  // Let DataTables finish its draw/layout pass.
  await page.waitForTimeout(600);
  await page.screenshot({ path: out, fullPage: true });

  console.log(`OK screenshot -> ${out}`);
  if (consoleErrors.length) {
    console.log(`CONSOLE_ERRORS(${consoleErrors.length}):`);
    for (const e of consoleErrors) console.log('  ' + e);
  } else {
    console.log('CONSOLE_ERRORS(0)');
  }
  if (dialogs.length) {
    console.log(`DIALOGS(${dialogs.length}) -- XSS/alert fired!:`);
    for (const d of dialogs) console.log('  ' + d);
  } else {
    console.log('DIALOGS(0)');
  }
} finally {
  await browser.close();
}
