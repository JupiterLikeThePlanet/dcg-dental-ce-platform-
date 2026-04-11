import { test, expect } from '@playwright/test';

test.describe('Signup Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await page.waitForSelector('form', { timeout: 10000 });
  });

  test('shows Full Name, Email, and Password fields', async ({ page }) => {
    await expect(page.locator('input[type="text"]')).toBeVisible(); // Full Name
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Full Name field is required', async ({ page }) => {
    // Submit without filling anything — browser validation should block it
    await page.click('button[type="submit"]');
    const fullNameInput = page.locator('input[type="text"]');
    const validationMessage = await fullNameInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).not.toBe('');
  });

  test('shows check-email success state after valid signup', async ({ page }) => {
    // Use a unique email so Supabase doesn't reject it as a duplicate
    const uniqueEmail = `test+${Date.now()}@example.com`;

    await page.fill('input[type="text"]', 'Dr. Test User');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Check your email')).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${uniqueEmail}`)).toBeVisible();
  });
});
