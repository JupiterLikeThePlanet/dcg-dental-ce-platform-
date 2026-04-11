/**
 * Admin Dashboard Tests
 *
 * Prerequisites:
 *   testadmin@example.com  — is_admin = true in the users table
 *   At least one submission with status = 'pending' must exist
 *
 * Approve/Reject tests mutate data — run against a test/staging Supabase project,
 * not production.
 */

import { test, expect, Page } from '@playwright/test';
import { login, TEST_ADMIN, TEST_USER } from './helpers/test-utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function gotoAdmin(page: Page) {
  await login(page, TEST_ADMIN);
  await page.goto('/admin');
  await page.waitForSelector('h1:has-text("Admin Dashboard")', { timeout: 10000 });
}

/** Click the first clickable row in the submissions table and wait for detail page. */
async function openFirstRow(page: Page, urlPattern: RegExp) {
  // With the recent change, title is now a <Link> — clicking it navigates
  const firstLink = page.locator('table tbody td a').first();
  const count = await firstLink.count();
  if (count === 0) {
    test.skip(true, 'No submissions in table — seed test data first');
    return;
  }
  await firstLink.click();
  await page.waitForURL(urlPattern, { timeout: 10000 });
}

// ─── Admin Access ─────────────────────────────────────────────────────────────

test.describe('Admin Access', () => {
  test('admin user lands on /admin after login', async ({ page }) => {
    await login(page, TEST_ADMIN);
    expect(page.url()).toContain('/admin');
  });

  test('shows "Admin Dashboard" heading and Admin badge', async ({ page }) => {
    await gotoAdmin(page);
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    await expect(page.locator('span:has-text("Admin")')).toBeVisible();
  });

  test('non-admin user is redirected away from /admin', async ({ page }) => {
    await login(page, TEST_USER);
    await page.goto('/admin');
    // Should redirect to dashboard with unauthorized error
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 10000 });
    expect(page.url()).not.toContain('/admin');
  });
});

// ─── Admin Dashboard — Submissions Queue ─────────────────────────────────────

test.describe('Admin Dashboard — Submissions Queue', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdmin(page);
  });

  test('shows stat cards for Pending Review, Approved, Rejected, Total', async ({ page }) => {
    await expect(page.locator('text=Pending Review').first()).toBeVisible();
    await expect(page.locator('text=Approved').first()).toBeVisible();
    await expect(page.locator('text=Rejected').first()).toBeVisible();
    await expect(page.locator('text=Total Submissions')).toBeVisible();
  });

  test('stat cards display numeric counts', async ({ page }) => {
    const cards = page.locator('.grid a p.text-2xl');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).textContent();
      expect(text?.trim()).toMatch(/^\d+$/);
    }
  });

  test('status tabs are present: Pending Review, Approved, Rejected, All', async ({ page }) => {
    await expect(page.locator('nav a:has-text("Pending Review")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Approved")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Rejected")')).toBeVisible();
    await expect(page.locator('nav a:has-text("All")')).toBeVisible();
  });

  test('default tab is "Pending Review"', async ({ page }) => {
    // Active tab has border-blue-500 class
    const activeTab = page.locator('nav a.border-blue-500');
    await expect(activeTab).toBeVisible();
    const text = await activeTab.textContent();
    expect(text).toContain('Pending Review');
  });

  test('clicking "All" tab shows all submissions', async ({ page }) => {
    await page.click('nav a:has-text("All")');
    await page.waitForURL(/status=all/, { timeout: 5000 });
    await expect(page.locator('nav a.border-blue-500')).toHaveText(/All/);
  });

  test('clicking "Approved" tab filters to approved submissions', async ({ page }) => {
    await page.click('nav a:has-text("Approved")');
    await page.waitForURL(/status=approved/, { timeout: 5000 });
    // All visible badges should say "Approved"
    const badges = page.locator('tbody .rounded-full');
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      const text = await badges.nth(i).textContent();
      expect(text).toContain('Approved');
    }
  });

  test('title link in table navigates to admin submission detail', async ({ page }) => {
    await openFirstRow(page, /\/admin\/submissions\//);
    expect(page.url()).toMatch(/\/admin\/submissions\//);
  });

  test('stat card click filters the table', async ({ page }) => {
    // Click the Approved stat card
    await page.click('a[href="/admin?status=approved"]');
    await page.waitForURL(/status=approved/, { timeout: 5000 });
    expect(page.url()).toContain('status=approved');
  });
});

// ─── Admin Submission Detail ──────────────────────────────────────────────────

test.describe('Admin Submission Detail', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdmin(page);
    // Default tab is Pending Review — open first pending submission
    await openFirstRow(page, /\/admin\/submissions\//);
  });

  test('shows submission title as a heading', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
  });

  test('shows status badge', async ({ page }) => {
    const badge = page.locator('span.rounded-full').first();
    await expect(badge).toBeVisible();
  });

  test('shows "✓ Approve" and "✕ Reject" buttons for pending submissions', async ({ page }) => {
    await expect(page.locator('button:has-text("Approve")')).toBeVisible();
    await expect(page.locator('button:has-text("Reject")')).toBeVisible();
  });

  test('shows all data sections', async ({ page }) => {
    await expect(page.locator('h2:has-text("Description")')).toBeVisible();
    await expect(page.locator('h2:has-text("Date & Time")')).toBeVisible();
    await expect(page.locator('h2:has-text("Location")')).toBeVisible();
    await expect(page.locator('h2:has-text("Course Info")')).toBeVisible();
    await expect(page.locator('h2:has-text("Instructor & Contact")')).toBeVisible();
    await expect(page.locator('h2:has-text("Registration")')).toBeVisible();
  });

  test('shows submitter email in metadata row', async ({ page }) => {
    await expect(page.locator('text=Submitted By')).toBeVisible();
  });

  test('"← Back to Admin Dashboard" link navigates back', async ({ page }) => {
    await page.click('a:has-text("← Back to Admin Dashboard")');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
    expect(page.url()).toContain('/admin');
  });
});

// ─── Reject Flow ─────────────────────────────────────────────────────────────

test.describe('Admin — Reject Flow', () => {
  test('clicking Reject opens the rejection reason modal', async ({ page }) => {
    await gotoAdmin(page);
    await openFirstRow(page, /\/admin\/submissions\//);
    await page.click('button:has-text("Reject")');

    await expect(page.locator('h3:has-text("Reject Submission")')).toBeVisible();
    await expect(page.locator('#rejection_reason')).toBeVisible();
    await expect(page.locator('button:has-text("Confirm Reject")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('Cancel closes the modal without rejecting', async ({ page }) => {
    await gotoAdmin(page);
    await openFirstRow(page, /\/admin\/submissions\//);
    await page.click('button:has-text("Reject")');
    await expect(page.locator('h3:has-text("Reject Submission")')).toBeVisible();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h3:has-text("Reject Submission")')).not.toBeVisible();
  });

  test('rejection reason textarea accepts text', async ({ page }) => {
    await gotoAdmin(page);
    await openFirstRow(page, /\/admin\/submissions\//);
    await page.click('button:has-text("Reject")');
    await page.fill('#rejection_reason', 'Missing required CE accreditation details');
    const value = await page.inputValue('#rejection_reason');
    expect(value).toBe('Missing required CE accreditation details');
  });

  /**
   * ⚠️  DATA-MUTATING TEST — rejects the first pending submission.
   * Comment this out when running against a shared environment.
   */
  test('confirming reject redirects to admin with rejection toast', async ({ page }) => {
    await gotoAdmin(page);
    await openFirstRow(page, /\/admin\/submissions\//);

    // Capture the title so we can verify it's gone from pending queue
    const title = await page.locator('h1').textContent();

    await page.click('button:has-text("Reject")');
    await page.fill('#rejection_reason', 'Automated test rejection');
    await page.click('button:has-text("Confirm Reject")');

    await page.waitForURL(/\/admin\?status=pending&message=rejected/, { timeout: 15000 });
    await expect(page.locator('text=Submission has been rejected')).toBeVisible({ timeout: 5000 });

    console.log(`Rejected: "${title}" — re-approve manually if needed`);
  });
});

// ─── Approve Flow ─────────────────────────────────────────────────────────────

test.describe('Admin — Approve Flow', () => {
  /**
   * ⚠️  DATA-MUTATING TEST — approves the first pending submission.
   * Comment this out when running against a shared environment.
   */
  test('approving redirects to admin with approval toast', async ({ page }) => {
    await gotoAdmin(page);
    await openFirstRow(page, /\/admin\/submissions\//);

    const title = await page.locator('h1').textContent();

    await page.click('button:has-text("Approve")');
    await page.waitForURL(/\/admin\?status=pending&message=approved/, { timeout: 15000 });
    await expect(
      page.locator('text=Submission approved and published successfully')
    ).toBeVisible({ timeout: 5000 });

    console.log(`Approved: "${title}" — now visible on /classes`);
  });

  test('approved submission no longer shows Approve/Reject buttons', async ({ page }) => {
    await gotoAdmin(page);
    // Switch to Approved tab
    await page.click('nav a:has-text("Approved")');
    await page.waitForURL(/status=approved/);
    await openFirstRow(page, /\/admin\/submissions\//);

    // Approve/Reject buttons only appear for pending — should not be here
    await expect(page.locator('button:has-text("Approve")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Reject")')).not.toBeVisible();
  });
});
