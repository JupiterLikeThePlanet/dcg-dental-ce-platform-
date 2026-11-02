# DCG Dental CE Platform — Testing & Staging Guide

**Who this is for:** Anyone working on this project — developer, QA reviewer, or project owner.
You do not need to be technical to follow this guide. Every command is spelled out exactly.

---

## Table of Contents

1. [The Big Picture — Why We Test This Way](#1-the-big-picture)
2. [Branch Strategy — Which Branch Does What](#2-branch-strategy)
3. [Your Current Situation and What To Do Right Now](#3-your-current-situation)
4. [Setting Up a Staging Environment in Supabase](#4-staging-supabase)
5. [Setting Up Your .env Files](#5-env-files)
6. [Creating Test Users in Supabase](#6-test-users)
7. [Running the Tests — Step by Step](#7-running-tests)
8. [Understanding Test Results](#8-understanding-test-results)
9. [Red Flags — What To Watch Out For](#9-red-flags)
10. [How To Avoid Deleting Real Live Data](#10-protecting-live-data)
11. [The Full Workflow — From Feature to Production](#11-full-workflow)
12. [Test File Reference](#12-test-file-reference)
13. [Troubleshooting Common Problems](#13-troubleshooting)

---

## 1. The Big Picture

### Why do we write tests?

Tests are automated scripts that pretend to be a real user clicking through your website.
They check that buttons work, forms validate, pages load, and actions (like approving a class)
produce the right result. Instead of manually clicking through 50 screens every time you make
a change, the tests do it in about 2 minutes.

### Why do we need a staging environment?

Some tests are **destructive** — they approve or reject real submissions, which changes the
database permanently. If you run those tests against your live production database, you will
accidentally approve/reject real submissions from real users.

A **staging environment** is an identical copy of your app connected to a separate, throwaway
database. Mess it up all you want — production is completely untouched.

### The three environments we use

| Environment | URL | Database | Purpose |
|---|---|---|---|
| **Local** | `http://localhost:3000` | Staging Supabase project | Development & running tests |
| **Staging** | Not deployed yet | Staging Supabase project | Pre-production testing |
| **Production** | Your live URL | Production Supabase project | Real users, real data — never run tests here |

---

## 2. Branch Strategy

Work happens on a feature branch. `main` is production. `staging` is the long-lived branch that gets tested before anything merges to `main`.

```
main              ← live production code. Merge here only when something is ready to ship.
  │
  └── staging     ← already exists. Pre-production. Test here before merging to main.
        │
        └── feature branches   ← where you edit. QA is one old example, not the branch to use.
```

### What each branch is for

**`main`**
- Connected to your production deployment (Vercel, etc.)
- Only merge here when code is tested and confirmed working
- Never develop directly on main
- Never run Playwright tests against the production database

**Feature branches**
- Make the change on a branch you create from `main` (`git checkout -b my-feature-name`)
- Check the name with `git branch --show-current` before you commit or push
- `QA` is an older feature branch (logout, auth callback, city→state filter, Playwright setup). It is not the current working branch. Do not commit new work onto it.

**`staging`**
- Already exists locally and on origin. Do not create it again.
- Mirrors what's about to go to production
- Playwright always targets the staging Supabase project, from whatever git branch you have checked out

### The golden rule

> If it touches the production database, do not automate it until it has passed in staging first.

---

## 3. Your Current Situation

Follow Section 11 for the path from a change to production. An earlier draft of this section is obsolete. It told you to:

- commit `tests/e2e/admin.spec.ts` and `tests/e2e/dashboard.spec.ts` (those files are already in the repo)
- push the `QA` branch (that is not the branch you should be on)
- run `git checkout -b staging` (that branch already exists)

Before any git command, run `git branch --show-current` and `git status`. Commit only on the feature branch those commands show.

---

## 4. Setting Up a Staging Environment in Supabase

This is the most important section for protecting your live data.

### Step 1 — Create a new Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New project"**
3. Name it something like `dcg-dental-staging`
4. Choose the same region as your production project
5. Set a strong database password (save it somewhere — you will not need it often)
6. Click **"Create new project"** and wait ~2 minutes for it to initialize

### Step 2 — Duplicate your database schema

> **Updated:** staging already exists. Don't copy schema from production with scripts.
> The source of truth is now `supabase/migrations/` in this repo (starting with
> `000_baseline.sql`, dumped from **staging**). Follow `docs/GUARDRAILS.md` and the
> `dcg-migration` skill: changes go to staging first, then prod only with explicit approval.

To rebuild a fresh staging project, run the files in `supabase/migrations/` in order in
the new project's SQL Editor.

To refresh the baseline from staging (never prod):

```bash
# Option A: CLI linked to staging (needs Docker running)
supabase link --project-ref duqgdsrvaxucbckqkygo
supabase db dump --linked --schema public -f supabase/migrations/000_baseline.sql

# Option B: pg_dump with the STAGING connection string
pg_dump --schema-only --schema=public "<staging connection string>" > supabase/migrations/000_baseline.sql
```

Don't use `supabase db push` from a laptop; it's blocked in `.claude/settings.json` on purpose.

### Step 3 — Copy your RLS policies

Row Level Security policies control who can see/edit what. They need to match production.

In Supabase → Authentication → Policies, review each table's policies and recreate them
in your staging project. This ensures tests run under the same security rules as production.

### Step 4 — Note your staging credentials

In your staging Supabase project, go to **Settings → API**. You will need:
- **Project URL** — looks like `https://xxxxxxxxxxx.supabase.co`
- **anon/public key** — the long string under "Project API keys"
- **service_role key** — keep this secret, never put it in frontend code

---

## 5. Setting Up Your .env Files

Your project uses environment variables to know which database to talk to.
**Never commit `.env` files to git** — they are already in `.gitignore`.

### .env.local (for running locally, connecting to staging database)

Create a file called `.env.local` in your project root:

```bash
# Supabase — STAGING project credentials (not production!)
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key

# Supabase service role (server-side only, never exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key

# Stripe — use TEST MODE keys (starts with pk_test_ and sk_test_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# Playwright test accounts (staging only) — read by tests/e2e/helpers/test-utils.ts
TEST_USER_EMAIL=your-staging-test-user-email
TEST_USER_PASSWORD=your-staging-test-user-password
TEST_ADMIN_EMAIL=your-staging-test-admin-email
TEST_ADMIN_PASSWORD=your-staging-test-admin-password
```

`playwright.config.ts` loads `.env.local` itself (Node's built-in `process.loadEnvFile`), so
the `TEST_*` vars are available to the specs without extra setup.

> **Critical:** When running tests locally, your `.env.local` must point to staging Supabase,
> NOT production. Double-check the URL before running any destructive tests.

### How to verify which database you are connected to

1. Start your app: `npm run dev`
2. Go to `http://localhost:3000`
3. Try to sign up with a new test email
4. Check **both** your staging and production Supabase dashboards → Authentication → Users
5. The new user should appear in staging only. If it appears in production, you have the wrong URL in `.env.local`.

---

## 6. Creating Test Users in Supabase

The tests expect two specific users to exist. Create them in your **staging** Supabase project.

### Create the regular test user

1. In your staging Supabase project, go to **Authentication → Users**
2. Click **"Add user" → "Create new user"**
3. Email: the value you'll put in `TEST_USER_EMAIL`
4. Password: a strong password; put it in `TEST_USER_PASSWORD` in `.env.local`
5. Click **"Create user"**
6. Then in your staging app, go through the signup flow OR manually confirm the email:
   In Supabase → Authentication → Users → find the user → click the three dots → "Send magic link"
   or just check "Email confirmed"

### Create the test admin user

Same steps, using `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD`.

Then make them an admin:
1. Go to Supabase → **Table Editor → users table**
2. Find the row for the test admin's email
3. Set `is_admin` to `true`
4. Save

### Seed test submission data

The status-specific tests (pending_payment, pending, rejected, approved) need submissions
in the database. The easiest way:

1. Log in to your staging app as the test user
2. Submit 3 test classes using the submit form (use a staging coupon or a Stripe test card)
3. Log in as the test admin and approve one, reject one, leave one pending
4. `pending_payment` can no longer be created through the UI (payment now happens before
   the form). To get one, set a staging row's `status` to `pending_payment` in the Table Editor.

Now the test user has one submission of each status, and the tests can find them.

---

## 7. Running the Tests — Step by Step

### Before every test run — the checklist

```
[ ] Your .env.local points to STAGING Supabase (not production)
[ ] The staging app is running: npm run start  (or npm run dev)
[ ] The app is accessible at http://localhost:3000
[ ] Test users exist in staging Supabase
[ ] Test submission data exists for each status type
```

### Start the app

Open a terminal window and run:

```bash
cd "/Volumes/Joop 3/coding_projects/DCG-Dental-APP/dca-code-base-test/dcg-dental-ce-platform (NEXT JS VERSION)"
npm run build && npm run start
```

Leave this terminal running. Open a second terminal for the test commands below.

> **Why `npm run start` instead of `npm run dev`?**
> `start` runs the production build, which is closer to the real deployed app.
> Tests run against `dev` can pass but fail in production due to differences in how
> Next.js handles server components. Use `start` for reliable results.

### Run all tests (headless — no visible browser)

```bash
npm run test:e2e
```

### Run all tests with a visible browser window

```bash
npm run test:e2e:headed
```

### Run the interactive Playwright UI (recommended for reviewing results)

```bash
npm run test:e2e:ui
```

This opens a window where you can:
- See every test listed on the left
- Click any test to re-run it
- Watch the browser execute each step in real time on the right
- See a timeline of every action with before/after screenshots

### Run only specific tests by name

```bash
# Run only submit-class tests
npx playwright test tests/e2e/submit-class.spec.ts --headed

# Run only dashboard tests
npx playwright test tests/e2e/dashboard.spec.ts --headed

# Run only admin tests
npx playwright test tests/e2e/admin.spec.ts --headed

# Run a specific test by searching its name
npx playwright test --grep "shows email validation error" --headed

# Run only on Chromium (skips the slow variant)
npx playwright test --project=chromium --headed
```

### Run tests slowly (easier to follow along visually)

```bash
npx playwright test --headed --project=chromium-slow
```

### View the HTML report after a run

```bash
npx playwright show-report
```

This opens a detailed report in your browser showing which tests passed, failed,
how long each took, and screenshots of any failures.

---

## 8. Understanding Test Results

### The summary line

After running, you will see something like:

```
✓ 18 passed (45s)
✗ 2 failed
```

### What a passing test looks like

```
✓ [chromium] › dashboard.spec.ts:42 › User Dashboard — Submissions List › table has expected columns
```

No action needed. ✓ means the feature works exactly as expected.

### What a failing test looks like

```
✗ [chromium] › admin.spec.ts:89 › Admin — Reject Flow › confirming reject redirects with toast
    Error: Timeout 10000ms exceeded waiting for URL /admin?status=pending&message=rejected
```

This means the test clicked "Confirm Reject" but the page did not redirect within 10 seconds.
Possible causes: the API returned an error, the database rejected the operation, or the
button is broken. Check the screenshot that Playwright saved in `test-results/`.

### Skipped tests

```
◌ [chromium] › dashboard.spec.ts:95 › Detail: Pending Payment › shows yellow notice
    skipped: No pending_payment submission found — seed test data first
```

This is not a failure. It means the test ran but found no data to work with.
Fix: create test data (see Section 6).

### The test result files

After running, two folders appear:
- `playwright-report/` — open `index.html` in a browser for the full visual report
- `test-results/` — screenshots and traces for failed tests

Both are in `.gitignore` — they are never committed to the repo.

---

## 9. Red Flags — What To Watch Out For

### 🔴 Red Flag: Tests passing but production is broken

**What it means:** Your tests are running against staging data that does not match production.
For example, staging has test submissions in all states, but production has none.

**How to catch it:** After merging to production, manually click through the critical paths
(login, submit a class, admin approve) at least once before declaring victory.

### 🔴 Red Flag: `.env.local` pointing to production

**How to check:**
```bash
cat "/Volumes/Joop 3/coding_projects/DCG-Dental-APP/dca-code-base-test/dcg-dental-ce-platform (NEXT JS VERSION)/.env.local"
```
The `NEXT_PUBLIC_SUPABASE_URL` should contain your staging project URL.
If it contains your production URL, stop and fix it before running any tests.

### 🔴 Red Flag: Running the approve/reject tests against production

The tests in `admin.spec.ts` labelled `⚠️ DATA-MUTATING TEST` will approve or reject
real submissions. They are clearly marked with warnings. Never run the full admin test
suite against production.

### 🔴 Red Flag: `test-results/` or `playwright-report/` showing up in `git status`

These directories contain screenshots from failed tests and should never be committed.
They are in `.gitignore`. If you see them in `git status`, something is wrong with your
gitignore. Run: `git rm -r --cached playwright-report/ test-results/`

### 🔴 Red Flag: All tests fail immediately with "Connection refused"

This means the app is not running. Make sure `npm run start` is running in another terminal
window before you run tests.

### 🔴 Red Flag: Tests fail with "No submissions found — seed test data first"

Not a code bug. You need to create test data in your staging Supabase project.
See Section 6.

### 🟡 Yellow Flag: Tests pass on `chromium` but fail on `chromium-slow`

Usually means a test is not waiting long enough for an animation or network request.
The form's "Next →" button has a 300ms animation. If `goToNextStep()` is not waiting
for the right element, it can fail on slow mode. Check the helper in `test-utils.ts`.

### 🟡 Yellow Flag: Auth-related tests fail intermittently

The Supabase auth lock error (the original bug this project fixed) can still occasionally
appear if multiple browser tabs are open during testing. Run tests one project at a time:
`--project=chromium` instead of running all projects.

---

## 10. How To Avoid Deleting Real Live Data

This section is the most important safety information in this document.

### The three layers of protection

**Layer 1: Separate Supabase projects**
Your production data lives in one Supabase project. Your staging data lives in a completely
separate project. They cannot interfere with each other. Even if a test drops every table
in staging, production is not affected.

**Layer 2: `.env.local` controls which database you hit**
The app reads the database URL from `.env.local`. If `.env.local` has the staging URL,
all reads and writes go to staging. Never swap in the production URL unless you are
deploying or doing a manual production task.

**Layer 3: Only the admin tests are destructive**
The submit-class tests and dashboard tests do not permanently alter data in ways that
matter — submissions created during testing can be ignored.
The approve and reject tests in `admin.spec.ts` are the only genuinely destructive ones.
They are clearly marked:

```
/**
 * ⚠️  DATA-MUTATING TEST — approves the first pending submission.
 * Comment this out when running against a shared environment.
 */
```

To disable them temporarily, add `.skip` to the test:
```typescript
test.skip('approving redirects...', async ({ page }) => {
```

### Before merging to main — the production safety checklist

```
[ ] All tests passed against staging (not production)
[ ] .env.local was pointing to staging during those test runs
[ ] The approve/reject tests either:
      (a) ran against staging only, OR
      (b) were skipped with test.skip
[ ] A manual smoke test was done on the live site after deploying
      (login, browse classes, submit a class — just the basics)
```

### What "smoke test" means

A smoke test is a quick 5-minute manual check of the most important features on production
after a deployment. Not a full test run — just enough to confirm nothing is obviously broken:
1. Can you load the home page?
2. Can you log in?
3. Can you browse classes?
4. Can you load the dashboard?

If any of these fail, roll back immediately (revert the merge on GitHub and redeploy).

---

## 11. The Full Workflow — From Feature to Production

Here is the process from "I want to make a change" to "it's live for users."

```
1. CREATE a feature branch from main
   git checkout main && git pull origin main
   git checkout -b my-feature-name

2. DEVELOP the feature on your local machine
   npm run dev  (connects to staging Supabase via .env.local)

3. WRITE or update tests for the feature

4. RUN tests locally against staging
   npm run build && npm run start
   npm run test:e2e:headed   (watch them run)

5. FIX any failures

6. COMMIT and push to GitHub
   git add [files]
   git commit -m "description of what changed"
   git push origin my-feature-name

7. OPEN a Pull Request → staging branch (not main)
   On GitHub: base = staging, compare = my-feature-name
   This merges your feature into staging for review

8. RUN tests on the staging branch
   git checkout staging && git pull
   npm run build && npm run start
   npm run test:e2e

9. If all tests pass → OPEN a Pull Request → main
   On GitHub: base = main, compare = staging

10. MERGE to main → triggers production deployment

11. SMOKE TEST the live site (5 minutes, see above)
```

### When to create which branches

| Situation | What to do |
|---|---|
| Starting a new feature | `git checkout -b feature/my-feature` from main |
| Fixing a bug | `git checkout -b fix/bug-description` from main |
| Improving tests or quality | `git checkout -b qa/improvement-description` from main |
| Batch of fixes ready to ship | Merge them all into staging, test, then merge staging → main |

---

## 12. Test File Reference

### Where the tests live

```
tests/
└── e2e/
    ├── helpers/
    │   └── test-utils.ts         ← shared login(), logout(), fillAllSteps() helpers
    ├── submit-class.spec.ts      ← tests for the 4-step submit form + payment
    ├── dashboard.spec.ts         ← tests for user dashboard + submission detail
    └── admin.spec.ts             ← tests for admin dashboard + approve/reject
```

### Configuration file

`playwright.config.ts` — controls how tests run:
- `baseURL: http://localhost:3000` — all tests run against local app
- `workers: 1` — tests run one at a time (important for auth state stability)
- `testIgnore: ['**/._*']` — ignores macOS resource fork files

### Test user credentials (staging only)

| User | Env vars | Role |
|---|---|---|
| Regular user | `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` | Standard user |
| Admin user | `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD` | Admin (is_admin = true) |

`tests/e2e/helpers/test-utils.ts` reads these from the environment (`.env.local`). They used to be
hardcoded in the repo, so rotate the old staging passwords. These accounts exist only in the
staging Supabase project — never in production.

### npm scripts

| Command | What it does |
|---|---|
| `npm run test:e2e` | Run all tests headlessly |
| `npm run test:e2e:headed` | Run all tests with visible browser |
| `npm run test:e2e:ui` | Open interactive Playwright UI |
| `npx playwright show-report` | Open the HTML report from the last run |
| `npx playwright test --grep "text"` | Run only tests matching "text" |
| `npx playwright test --project=chromium` | Run only on Chromium (not slow variant) |

---

## 13. Troubleshooting Common Problems

### "Cannot find module @playwright/test"

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

### "Browser was not found"

```bash
npx playwright install
```

### "Error: connect ECONNREFUSED 127.0.0.1:3000"

The app is not running. Open a separate terminal and run:
```bash
npm run build && npm run start
```

### Tests fail with login errors

1. Check that the `TEST_USER_EMAIL` account exists in your staging Supabase project
2. Check that their email is confirmed (Authentication → Users → check the "Confirmed" column)
3. Check that `.env.local` points to staging
4. Try logging in manually at `http://localhost:3000/login` with those credentials

### "SyntaxError: Unexpected character ''" on a `._` file

macOS resource fork file is being picked up. The `testIgnore` in `playwright.config.ts`
should handle this. If it persists:
```bash
find tests/ -name "._*" -delete
```

### A test skips with "seed test data first"

No submissions of that status exist in staging. Follow Section 6 to create them.

### Approve/reject tests fail with 401 or 403

The test admin user either:
- Does not exist in staging
- Exists but `is_admin` is not set to `true` in the users table

Fix in Supabase → Table Editor → users → find the `TEST_ADMIN_EMAIL` account → set is_admin = true.

---

*Last updated: April 2026*
*Maintained by: Jupiter / DCG Dental development team*
