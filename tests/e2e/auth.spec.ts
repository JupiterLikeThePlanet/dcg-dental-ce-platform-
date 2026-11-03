/**
 * Auth page behavior for users who are already logged in.
 */

import { test, expect } from '@playwright/test';
import { login } from './helpers/test-utils';

test.describe('Login page when already logged in', () => {
  test('shows the "already logged in" card instead of a blank page', async ({ page }) => {
    await login(page);
    await page.goto('/login');
    await expect(page.locator("text=You're already logged in")).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Go to Dashboard")')).toBeVisible();
  });
});
