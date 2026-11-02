---
name: dcg-launch-check
description: Pre-launch and pre-deploy audit for DCG Dental. Checks code, build, env setup, Stripe mode, webhooks, RLS, auth URLs, email, and cron. Use before any production deploy, go-live, handoff, or when asked "are we ready to launch?"
---

# Launch check

Produce a checklist with a status for every line: ✅ verified, ❌ broken, ❓ needs a human to check in a dashboard. Never mark a dashboard setting ✅ unless Jupiter confirmed it in this session.

## Code (you can verify these)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] No module-level Stripe / Supabase server client init: grep `app/api` for `new Stripe(` and `createClient(` outside handlers
- [ ] No imports of `@supabase/auth-helpers-nextjs`
- [ ] No stray non-`route.ts` files in `app/api` or route folders
- [ ] No secrets in tracked files: `git grep -nE "sk_live|sk_test|whsec_|sb_secret|service_role"`
- [ ] `.env*` is gitignored
- [ ] Playwright suite passes against staging

## Vercel (ask Jupiter)
- [ ] Production env vars point at prod Supabase (`vropbtrpnoxmavixlvsb`)
- [ ] Production uses `sk_live_` / `pk_live_` and the live `whsec_`
- [ ] Preview env points at staging + test keys
- [ ] `CRON_SECRET` is set
- [ ] Domain dcgdental.com attached, SSL valid

## Stripe (ask Jupiter)
- [ ] Live webhook endpoint `https://dcgdental.com/api/webhooks/stripe` exists, subscribed to `checkout.session.completed`
- [ ] One real $5 test payment completed and refunded, status flipped to `pending`

## Supabase prod (ask Jupiter)
- [ ] RLS enabled on every public table, including `users`
- [ ] Auth Site URL = `https://dcgdental.com`, redirect URLs include `/auth/callback`
- [ ] Branded email templates present in prod, not just staging
- [ ] SMTP: built-in or custom, and which
- [ ] Admin users are only the intended people
- [ ] No leftover test data or test coupons in prod

## Scheduled jobs
- [ ] Cleanup route is scheduled somewhere. Note: it only accepts POST, Vercel Cron sends GET.

## Output
- The checklist with statuses
- A short "blockers" list at the top
- Update `docs/STATUS.md` with anything newly verified. Ask before committing.
