import { Page } from '@playwright/test';

export const TEST_USER = {
  email: 'testuser@example.com',
  password: 'testpassword123',
};

export const TEST_ADMIN = {
  email: 'testadmin@example.com',
  password: 'testpassword123',
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

  // Step 3
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
