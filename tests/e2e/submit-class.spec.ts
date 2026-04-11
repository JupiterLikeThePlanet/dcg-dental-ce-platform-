import { test, expect } from '@playwright/test';
import { login, fillAllSteps, goToNextStep } from './helpers/test-utils';

// ─── Shared setup ────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.goto('/submit');
  // Wait for the form to be ready
  await page.waitForSelector('#title', { timeout: 10000 });
});

// ─── Step 1: Basic Info ───────────────────────────────────────────────────────

test.describe('Step 1: Basic Info', () => {
  test('shows validation errors when Next is clicked on empty form', async ({ page }) => {
    await page.click('button:has-text("Next →")');
    await expect(page.locator('text=Title is required')).toBeVisible();
    await expect(page.locator('text=Description is required')).toBeVisible();
    await expect(page.locator('text=Category is required')).toBeVisible();
  });

  test('title is capped at 100 characters by the HTML maxLength attribute', async ({ page }) => {
    await page.fill('#title', 'a'.repeat(150));
    const value = await page.inputValue('#title');
    expect(value.length).toBeLessThanOrEqual(100);
  });

  test('description is capped at 1000 characters by the HTML maxLength attribute', async ({ page }) => {
    await page.fill('#description', 'a'.repeat(1100));
    const value = await page.inputValue('#description');
    expect(value.length).toBeLessThanOrEqual(1000);
  });

  test('stays on step 1 if category is not selected', async ({ page }) => {
    await page.fill('#title', 'Test Class');
    await page.fill('#description', 'A test description for this class');
    // Deliberately skip category
    await page.click('button:has-text("Next →")');
    await expect(page.locator('text=Category is required')).toBeVisible();
    await expect(page.locator('#title')).toBeVisible(); // Still on step 1
  });

  test('proceeds to step 2 with valid data', async ({ page }) => {
    await page.fill('#title', 'Test Dental Class');
    await page.fill('#description', 'A comprehensive dental CE course');
    await page.selectOption('#category', 'Implants');
    await goToNextStep(page, '#start_date');
    await expect(page.locator('#start_date')).toBeVisible();
  });
});

// ─── Step 2: Date & Time ──────────────────────────────────────────────────────

test.describe('Step 2: Date & Time', () => {
  test.beforeEach(async ({ page }) => {
    await page.fill('#title', 'Test Dental Class');
    await page.fill('#description', 'A comprehensive dental CE course');
    await page.selectOption('#category', 'Implants');
    await goToNextStep(page, '#start_date');
  });

  test('shows error when start date is empty', async ({ page }) => {
    await page.click('button:has-text("Next →")');
    await expect(page.locator('text=Start date is required')).toBeVisible();
  });

  test('start and end time default to 08:00 and 17:00', async ({ page }) => {
    expect(await page.inputValue('#start_time')).toBe('08:00');
    expect(await page.inputValue('#end_time')).toBe('17:00');
  });

  test('Back button returns to step 1', async ({ page }) => {
    await page.click('button:has-text("← Back")');
    await expect(page.locator('#title')).toBeVisible();
  });

  test('proceeds to step 3 with valid start date', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('#start_date', tomorrow.toISOString().split('T')[0]);
    await goToNextStep(page, '#address_line1');
    await expect(page.locator('#address_line1')).toBeVisible();
  });
});

// ─── Step 3: Location ─────────────────────────────────────────────────────────

test.describe('Step 3: Location', () => {
  test.beforeEach(async ({ page }) => {
    await page.fill('#title', 'Test Dental Class');
    await page.fill('#description', 'A comprehensive dental CE course');
    await page.selectOption('#category', 'Implants');
    await goToNextStep(page, '#start_date');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('#start_date', tomorrow.toISOString().split('T')[0]);
    await goToNextStep(page, '#address_line1');
  });

  test('shows validation errors for empty required fields', async ({ page }) => {
    await page.click('button:has-text("Next →")');
    await expect(page.locator('text=Address is required')).toBeVisible();
    await expect(page.locator('text=City is required')).toBeVisible();
    await expect(page.locator('text=ZIP code is required')).toBeVisible();
  });

  test('address line 2 is optional — can proceed without it', async ({ page }) => {
    await page.fill('#address_line1', '123 Main St');
    // Skip address_line2
    await page.fill('#city', 'New Orleans');
    // state already defaults to LA
    await page.fill('#zip_code', '70112');
    await goToNextStep(page, '#instructor_name');
    await expect(page.locator('#instructor_name')).toBeVisible();
  });

  test('shows ZIP code error for invalid format', async ({ page }) => {
    await page.fill('#address_line1', '123 Main St');
    await page.fill('#city', 'New Orleans');
    await page.fill('#zip_code', 'invalid');
    await page.click('button:has-text("Next →")');
    await expect(page.locator('text=Invalid ZIP code')).toBeVisible();
  });

  test('accepts 5-digit and 9-digit ZIP codes', async ({ page }) => {
    await page.fill('#address_line1', '123 Main St');
    await page.fill('#city', 'New Orleans');
    await page.fill('#zip_code', '70112-1234');
    await goToNextStep(page, '#instructor_name');
    await expect(page.locator('#instructor_name')).toBeVisible();
  });
});

// ─── Step 4: Details ──────────────────────────────────────────────────────────

test.describe('Step 4: Details', () => {
  test.beforeEach(async ({ page }) => {
    await page.fill('#title', 'Test Dental Class');
    await page.fill('#description', 'A comprehensive dental CE course');
    await page.selectOption('#category', 'Implants');
    await goToNextStep(page, '#start_date');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('#start_date', tomorrow.toISOString().split('T')[0]);
    await goToNextStep(page, '#address_line1');

    await page.fill('#address_line1', '123 Main St');
    await page.fill('#city', 'New Orleans');
    await page.fill('#zip_code', '70112');
    await goToNextStep(page, '#instructor_name');
  });

  test('shows errors for empty required fields on submit', async ({ page }) => {
    await page.click('button:has-text("Submit for Review")');
    await expect(page.locator('text=Instructor name is required')).toBeVisible();
    await expect(page.locator('text=Provider/organization name is required')).toBeVisible();
    await expect(page.locator('text=Price is required')).toBeVisible();
    await expect(page.locator('text=Registration URL is required')).toBeVisible();
  });

  test('shows email validation error for invalid email format', async ({ page }) => {
    await page.fill('#instructor_name', 'Dr. Smith');
    await page.fill('#provider_name', 'Dental Academy');
    await page.fill('#contact_email', 'not-an-email');
    await page.fill('#price', '100');
    await page.fill('#registration_url', 'https://example.com');
    await page.click('button:has-text("Submit for Review")');
    await expect(page.locator('text=Invalid email format')).toBeVisible();
  });

  test('coupon code field is visible', async ({ page }) => {
    await expect(page.locator('#coupon_code')).toBeVisible();
  });

  test('CE credits field is optional — submit is enabled without it', async ({ page }) => {
    await page.fill('#instructor_name', 'Dr. Smith');
    await page.fill('#provider_name', 'Dental Academy');
    await page.fill('#price', '100');
    await page.fill('#registration_url', 'https://example.com');
    // ce_credits intentionally blank
    await expect(page.locator('button:has-text("Submit for Review")')).toBeEnabled();
  });

  test('registration URL must start with http or https', async ({ page }) => {
    await page.fill('#instructor_name', 'Dr. Smith');
    await page.fill('#provider_name', 'Dental Academy');
    await page.fill('#price', '100');
    await page.fill('#registration_url', 'example.com'); // Missing protocol
    await page.click('button:has-text("Submit for Review")');
    await expect(page.locator('text=URL must start with http')).toBeVisible();
  });
});

// ─── Payment Flow ─────────────────────────────────────────────────────────────

test.describe('Payment Flow', () => {
  test('submitting without a coupon redirects to Stripe checkout', async ({ page }) => {
    await fillAllSteps(page, String(Date.now()));
    await page.click('button:has-text("Submit for Review")');

    // Stripe redirect can take a moment
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20000 });
  });

  test('submitting with a valid coupon goes to success page (no Stripe)', async ({ page }) => {
    await fillAllSteps(page, String(Date.now()));
    await page.fill('#coupon_code', 'TESTFREE');
    await page.click('button:has-text("Submit for Review")');

    await page.waitForURL(/\/submit\/success/, { timeout: 15000 });
  });

  test('submitting with an invalid coupon shows an error', async ({ page }) => {
    await fillAllSteps(page, String(Date.now()));
    await page.fill('#coupon_code', 'INVALIDCODE999');
    await page.click('button:has-text("Submit for Review")');

    await expect(
      page.locator('text=Invalid').or(page.locator('text=invalid')).or(page.locator('text=expired'))
    ).toBeVisible({ timeout: 10000 });
  });
});
