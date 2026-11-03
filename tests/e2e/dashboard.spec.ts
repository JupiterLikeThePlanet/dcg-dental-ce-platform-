/**
 * User Dashboard Tests
 *
 * Prerequisites — these test users + submissions must exist in Supabase:
 *   TEST_USER_EMAIL account (from .env.local) — has at least one submission of each status
 *   TEST_ADMIN_EMAIL account (from .env.local) — is_admin = true
 *
 * Status badge labels (from StatusBadge.tsx):
 *   pending_payment → "Pending Payment"
 *   pending         → "Pending Review"
 *   approved        → "Approved"
 *   rejected        → "Rejected"
 */

import { test, expect, Page } from '@playwright/test';
import { login, TEST_USER, passThroughPaymentGate, goToNextStep, STATUS_BADGES } from './helpers/test-utils';

/** A filter tab button. Its accessible name is the label plus a count, e.g. "Pending3". */
function filterTab(page: Page, label: string) {
  return page.getByRole('button', { name: new RegExp(`^${label}\\d*$`) });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Navigate to the dashboard and wait for the submissions table. */
async function gotoDashboard(page: Page) {
  await login(page);
  await page.goto('/dashboard');
  await page.waitForSelector('table', { timeout: 10000 });
}

/**
 * Click the first row in the filtered table and return to the detail URL.
 * Skips the test with a warning if no rows are visible.
 */
async function openFirstSubmission(page: Page): Promise<string> {
  const rows = page.locator('tbody tr[class*="cursor-pointer"]');
  const count = await rows.count();
  if (count === 0) {
    test.skip(true, 'No submissions found for this filter — seed test data first');
    return '';
  }
  await rows.first().click();
  await page.waitForURL(/\/dashboard\/submissions\//, { timeout: 10000 });
  return page.url();
}

// ─── Submissions List (/dashboard) ───────────────────────────────────────────

test.describe('User Dashboard — Submissions List', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page);
  });

  test('shows the dashboard page with a submissions table', async ({ page }) => {
    await expect(page.locator('h1:has-text("My Dashboard")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('table has expected columns: Class, Location, Class Date, Status, Submitted', async ({ page }) => {
    for (const name of ['Class', 'Location', 'Class Date', 'Status', 'Submitted']) {
      await expect(page.getByRole('columnheader', { name, exact: true })).toBeVisible();
    }
  });

  test('filter tabs are visible: All, Pending, Approved, Rejected', async ({ page }) => {
    for (const label of ['All', 'Pending', 'Approved', 'Rejected']) {
      await expect(filterTab(page, label)).toBeVisible();
    }
  });

  test('Pending filter tab shows only pending submissions', async ({ page }) => {
    await filterTab(page, 'Pending').click();

    // Every status badge in the table must be "Pending Review" or "Pending Payment"
    const badges = page.locator(STATUS_BADGES);
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      expect(await badges.nth(i).textContent()).toMatch(/Pending/);
    }
  });

  test('Approved filter tab shows only approved submissions', async ({ page }) => {
    await filterTab(page, 'Approved').click();
    const badges = page.locator(STATUS_BADGES);
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      expect(await badges.nth(i).textContent()).toContain('Approved');
    }
  });

  test('Rejected filter tab shows only rejected submissions', async ({ page }) => {
    await filterTab(page, 'Rejected').click();
    const badges = page.locator(STATUS_BADGES);
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      expect(await badges.nth(i).textContent()).toContain('Rejected');
    }
  });

  test('clicking a row navigates to the submission detail page', async ({ page }) => {
    await openFirstSubmission(page);
    expect(page.url()).toMatch(/\/dashboard\/submissions\//);
  });

  test('shows count next to each filter tab', async ({ page }) => {
    // Each tab button contains a number span (the count)
    const allTab = page.locator('button:has-text("All")');
    const tabText = await allTab.textContent();
    // Text is like "All 3" — verify a number is present
    expect(tabText).toMatch(/\d/);
  });
});

// ─── Submission Detail — Shared ───────────────────────────────────────────────

test.describe('User Dashboard — Submission Detail (shared)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page);
    await openFirstSubmission(page);
  });

  test('shows submission title as a heading', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
  });

  test('shows a status badge', async ({ page }) => {
    // StatusBadge renders a rounded-full span with one of the known labels
    const badge = page.locator('span.rounded-full').first();
    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(text).toMatch(/Pending Payment|Pending Review|Approved|Rejected/);
  });

  test('"Use as Template" button is always visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Use as Template")')).toBeVisible();
  });

  test('"Back to Dashboard" link is present', async ({ page }) => {
    await expect(page.locator('a:has-text("Back to Dashboard")')).toBeVisible();
  });

  test('shows full submission data sections', async ({ page }) => {
    await expect(page.locator('h2:has-text("Description")')).toBeVisible();
    await expect(page.locator('h2:has-text("Date & Time")')).toBeVisible();
    await expect(page.locator('h2:has-text("Location")')).toBeVisible();
    await expect(page.locator('h2:has-text("Course Info")')).toBeVisible();
    await expect(page.locator('h2:has-text("Instructor & Contact")')).toBeVisible();
    await expect(page.locator('h2:has-text("Registration")')).toBeVisible();
  });
});

// ─── Submission Detail — pending_payment status ───────────────────────────────

test.describe('User Dashboard — Detail: Pending Payment status', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page);
    await page.click('button:has-text("Pending")');
    // Find a row that has the "Pending Payment" badge
    const targetRow = page.locator('tbody tr').filter({ hasText: 'Pending Payment' }).first();
    const count = await targetRow.count();
    if (count === 0) test.skip(true, 'No pending_payment submission found — seed test data first');
    await targetRow.click();
    await page.waitForURL(/\/dashboard\/submissions\//, { timeout: 10000 });
  });

  test('shows yellow "Payment Required" notice', async ({ page }) => {
    await expect(page.locator('h3:has-text("Payment Required")')).toBeVisible();
  });

  test('"Complete Payment" button is visible in the header', async ({ page }) => {
    await expect(page.locator('button:has-text("Complete Payment")')).toBeVisible();
  });

  test('"Edit Class Details" link is visible in the metadata row', async ({ page }) => {
    await expect(page.locator('button:has-text("Edit Class Details")')).toBeVisible();
  });

  test('clicking "Complete Payment" expands the payment panel', async ({ page }) => {
    await page.click('button:has-text("Complete Payment")');
    await expect(page.locator('h3:has-text("Edit Payment Details")')).toBeVisible();
    await expect(page.locator('button:has-text("Proceed to Payment")')).toBeVisible();
  });

  test('payment panel can be dismissed with Cancel', async ({ page }) => {
    await page.click('button:has-text("Complete Payment")');
    await expect(page.locator('button:has-text("Proceed to Payment")')).toBeVisible();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('button:has-text("Proceed to Payment")')).not.toBeVisible();
  });

  test('"Edit Class Details" redirects to /submit?edit=true', async ({ page }) => {
    await page.click('button:has-text("Edit Class Details")');
    await page.waitForURL(/\/submit\?edit=true/, { timeout: 10000 });
  });
});

// ─── Submission Detail — pending (review) status ──────────────────────────────

test.describe('User Dashboard — Detail: Pending Review status', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page);
    await page.click('button:has-text("Pending")');
    const targetRow = page.locator('tbody tr').filter({ hasText: 'Pending Review' }).first();
    const count = await targetRow.count();
    if (count === 0) test.skip(true, 'No pending submission found — seed test data first');
    await targetRow.click();
    await page.waitForURL(/\/dashboard\/submissions\//, { timeout: 10000 });
  });

  test('shows blue "Pending Review" notice', async ({ page }) => {
    await expect(page.locator('h3:has-text("Pending Review")')).toBeVisible();
  });

  test('"Edit Submission" button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Edit Submission")')).toBeVisible();
  });

  test('"Edit Submission" redirects to /submit?edit=true', async ({ page }) => {
    await page.click('button:has-text("Edit Submission")');
    await page.waitForURL(/\/submit\?edit=true/, { timeout: 10000 });
  });
});

// ─── Submission Detail — rejected status ─────────────────────────────────────

test.describe('User Dashboard — Detail: Rejected status', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page);
    await filterTab(page, 'Rejected').click();
    const targetRow = page.locator('tbody tr').filter({ hasText: 'Rejected' }).first();
    const count = await targetRow.count();
    if (count === 0) test.skip(true, 'No rejected submission found — seed test data first');
    await targetRow.click();
    await page.waitForURL(/\/dashboard\/submissions\//, { timeout: 10000 });
  });

  test('shows red "Submission Rejected" notice', async ({ page }) => {
    await expect(page.locator('h3:has-text("Submission Rejected")')).toBeVisible();
  });

  test('"Edit & Resubmit" button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Edit & Resubmit")')).toBeVisible();
  });

  test('"Edit & Resubmit" redirects to /submit?edit=true', async ({ page }) => {
    await page.click('button:has-text("Edit & Resubmit")');
    await page.waitForURL(/\/submit\?edit=true/, { timeout: 10000 });
  });
});

// ─── Submission Detail — approved status ─────────────────────────────────────

test.describe('User Dashboard — Detail: Approved status', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page);
    await page.click('button:has-text("Approved")');
    const targetRow = page.locator('tbody tr').filter({ hasText: 'Approved' }).first();
    const count = await targetRow.count();
    if (count === 0) test.skip(true, 'No approved submission found — seed test data first');
    await targetRow.click();
    await page.waitForURL(/\/dashboard\/submissions\//, { timeout: 10000 });
  });

  test('shows green "Approved & Live" notice', async ({ page }) => {
    await expect(page.locator('h3:has-text("Approved & Live")')).toBeVisible();
  });

  test('"Edit Listing" button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Edit Listing")')).toBeVisible();
  });

  test('link to browse all classes is visible', async ({ page }) => {
    await expect(page.locator('a:has-text("View all classes")')).toBeVisible();
  });
});

// ─── Edit Submission Flow ─────────────────────────────────────────────────────

test.describe('Edit Submission Flow', () => {
  test('edit flow pre-fills form and shows Edit & Resubmit Mode banner', async ({ page }) => {
    await gotoDashboard(page);
    await filterTab(page, 'Rejected').click();
    const targetRow = page.locator('tbody tr').filter({ hasText: 'Rejected' }).first();
    if (await targetRow.count() === 0) {
      test.skip(true, 'No rejected submission found — seed test data first');
      return;
    }
    await targetRow.click();
    await page.waitForURL(/\/dashboard\/submissions\//, { timeout: 10000 });
    await page.click('button:has-text("Edit & Resubmit")');
    await page.waitForURL(/\/submit\?edit=true/, { timeout: 10000 });

    // Banner and pre-filled title field
    await expect(page.locator('text=Edit & Resubmit Mode')).toBeVisible();
    const title = await page.inputValue('#title');
    expect(title.length).toBeGreaterThan(0); // pre-filled
  });

  test('"Use as Template" pre-fills form and shows Using Template banner', async ({ page }) => {
    await gotoDashboard(page);
    await openFirstSubmission(page);
    await page.click('button:has-text("Use as Template")');
    await page.waitForURL(/\/submit\?template=true/, { timeout: 10000 });

    // A template is a new listing, so it goes through the payment gate first
    await passThroughPaymentGate(page);
    // The seeded source row may lack a category; set one so step 1 validates
    await page.selectOption('#category', 'Implants');

    await expect(page.locator('text=Using Template')).toBeVisible();
    // Title is pre-filled
    const title = await page.inputValue('#title');
    expect(title.length).toBeGreaterThan(0);
    // Start date (step 2) is cleared for a template
    await goToNextStep(page, '#start_date');
    expect(await page.inputValue('#start_date')).toBe('');
  });
});
