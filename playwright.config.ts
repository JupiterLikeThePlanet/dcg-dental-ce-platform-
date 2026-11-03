import { defineConfig, devices } from '@playwright/test';

// Load test account credentials (TEST_USER_*, TEST_ADMIN_*) from .env.local.
// Uses Node's built-in loader; no dotenv dependency. Already-set vars win.
try {
  process.loadEnvFile('.env.local');
} catch {
  // No .env.local (e.g. CI): rely on the environment instead
}

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**\/._*'],
  fullyParallel: false, // Sequential — tests share auth state via storageState
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-slow',
      use: { ...devices['Desktop Chrome'], launchOptions: { slowMo: 500 } },
    },
  ],
});
