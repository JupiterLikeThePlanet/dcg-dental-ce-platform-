import { Page } from '@playwright/test';

/**
 * Staging test accounts. Credentials come from env vars (set them in
 * .env.local, which playwright.config.ts loads), never from the repo.
 * Read lazily so specs that don't log in still run without them.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local (staging test account). See docs/testing-guide.md.`);
  }
  return value;
}

export const TEST_USER = {
  get email() { return requireEnv('TEST_USER_EMAIL'); },
  get password() { return requireEnv('TEST_USER_PASSWORD'); },
};

export const TEST_ADMIN = {
  get email() { return requireEnv('TEST_ADMIN_EMAIL'); },
  get password() { return requireEnv('TEST_ADMIN_PASSWORD'); },
};

export async function login(page: Page, user = TEST_USER) {
  await page.goto('/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 });
}

export async function logout(page: Page) {
  await page.click('button:has-text("Logout")');
  await page.waitForURL('/', { timeout: 10000 });
}

/** Apply the staging test coupon at the payment gate so the form appears. */
/**
 * Mirrors lib/paywall.ts. Both the server (npm run start) and Playwright read
 * PAYWALL_ENABLED from .env.local, so the tests follow whatever mode the app is in.
 */
export const PAYWALL_ENABLED = process.env.PAYWALL_ENABLED === 'true';

export async function passThroughPaymentGate(page: Page) {
  if (!PAYWALL_ENABLED) {
    // No gate: the form shows right away
    await page.waitForSelector('#title', { timeout: 10000 });
    return;
  }
  await page.waitForSelector('input[placeholder="Enter coupon code"]', { timeout: 10000 });
  await page.fill('input[placeholder="Enter coupon code"]', 'TESTFREE');
  await page.click('button:has-text("Apply")');
  await page.waitForSelector('#title', { timeout: 10000 });
}

/**
 * Status badges in a table. Excludes the empty colored dot inside each badge
 * (also .rounded-full) and copies hidden at the current screen size.
 */
export const STATUS_BADGES = 'tbody span.rounded-full.text-xs:visible';

/** Navigate to the next step and wait for the step content to appear. */
export async function goToNextStep(page: Page, waitForSelector: string) {
  await page.click('button:has-text("Next →")');
  await page.waitForSelector(waitForSelector, { timeout: 5000 });
}

/** Fill all four steps of the submit form up to (but not including) the final submit click. */
export async function fillAllSteps(page: Page, titleSuffix = '') {
  // Step 1
  await page.fill('#title', `Test Dental Class ${titleSuffix}`);
  await page.fill('#description', 'A comprehensive dental CE course for testing purposes');
  await page.selectOption('#category', 'Implants');
  await goToNextStep(page, '#start_date');

  // Step 2
  const future = new Date();
  future.setDate(future.getDate() + 30);
  await page.fill('#start_date', future.toISOString().split('T')[0]);
  await goToNextStep(page, '#address_line1');

  // Step 3 (attendance type is required; street address and ZIP are optional)
  await page.selectOption('#attendance_type', 'on-site');
  await page.fill('#address_line1', '123 Main St');
  await page.fill('#city', 'New Orleans');
  // state defaults to LA — no change needed
  await page.fill('#zip_code', '70112');
  await goToNextStep(page, '#instructor_name');

  // Step 4
  await page.fill('#instructor_name', 'Dr. Test Smith');
  await page.fill('#provider_name', 'Test Dental Academy');
  await page.fill('#price', '250');
  await page.fill('#registration_url', 'https://example.com/register');
}
