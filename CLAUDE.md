# DCG Dental CE Platform

Directory site where dental CE providers list classes and dentists find them. Providers pay $5 per listing (or use a coupon). An admin approves every listing before it goes live. We link out to registration; we never host enrollment.

Client: Russell Schafer, DDS. Lead/PM: Jupiter Baudot. Live at dcgdental.com.

## Read before you work

Load the doc that matches the task. Don't load all of them every time.

| Task | Read |
|---|---|
| Any change at all | `docs/GUARDRAILS.md`, `docs/KNOWN-TRAPS.md` |
| Writing code | `docs/CONVENTIONS.md` |
| Queries, schema, RLS | `docs/DATA-MODEL.md` |
| Routes, flows, where things live | `docs/ARCHITECTURE.md` |
| Business logic, "should it work like X?" | `docs/PRODUCT-RULES.md` |
| Env vars, staging vs prod, deploys | `docs/ENVIRONMENTS.md` |
| "Why is it built this way?" | `docs/DECISIONS.md` |
| What's done, what's next | `docs/STATUS.md` |
| Dental terms | `docs/GLOSSARY.md` |
| Running tests | `docs/testing-guide.md` |

## Stack

- Next.js 14 App Router, TypeScript strict, React 18
- Supabase (Postgres + Auth) via `@supabase/ssr`
- Stripe Checkout (`stripe` server SDK, `@stripe/stripe-js` client)
- Tailwind CSS v3
- Vercel hosting
- Playwright E2E

## Commands

```bash
npm run dev               # local dev (turbo)
npm run build             # run this before saying a change is done
npm run lint
npx tsc --noEmit          # typecheck
npm run test:e2e          # Playwright, against STAGING only
npm run test:e2e:headed
```

## Five rules that matter most

1. Never touch the production Supabase project or live Stripe without an explicit yes in chat.
2. Never "fix" an access error by disabling RLS.
3. Create Stripe and Supabase server clients inside the handler, never at module level.
4. Don't invent columns. Check `docs/DATA-MODEL.md` or the real schema first.
5. Edit approval and commit approval are separate. Never push.

## Skills in this repo

Project skills live in `.claude/skills/`:

- `dcg-add-field` adds a field to class listings end to end
- `dcg-migration` writes and applies a schema change safely
- `dcg-launch-check` runs the pre-launch / pre-deploy audit
- `dcg-client-guide` writes plain-language docs for Russell

## Keeping these docs true

- If you find a doc that disagrees with the code, the code wins. Say so and propose the doc fix.
- Anything marked `TODO: verify` is unconfirmed. Don't treat it as fact.
- Update `docs/STATUS.md` when a task in it is finished.
