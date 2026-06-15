import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Uses a dedicated dev-server port (4288) so it never collides with the manual dev
 * server (4287) or other local processes. The webServer command sources nvm so `ng serve` runs on
 * the Angular-22-compatible Node.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4288',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'bash -lc ". ~/.nvm/nvm.sh && nvm use >/dev/null && npx ng serve demo --port 4288"',
    url: 'http://localhost:4288',
    timeout: 180_000,
    reuseExistingServer: !process.env['CI'],
  },
});
