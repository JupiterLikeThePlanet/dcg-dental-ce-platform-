# Guardrails

Hard rules. If a task seems to need breaking one, stop and ask instead.

## Production
- Never run SQL, migrations, or scripts against prod Supabase (`vropbtrpnoxmavixlvsb`) without an explicit yes in chat for that specific action
- Never switch `.env.local` to prod values
- Never run Playwright against prod. Tests approve and reject real rows.
- Never run `vercel --prod`

## Security
- Never disable RLS to make something work. Write a narrower policy and explain it.
- Never use the service role client in a Client Component or anything shipped to the browser
- Never commit secrets. Never paste key values into docs, comments, commits, or chat.
- Never read `.env.local` to "check a value." Ask, or check variable names only.

## Payments
- Live Stripe keys only exist in Vercel Production
- Don't change the $5 price, coupon logic, or webhook handling without being asked

## Data
- Schema changes go through the `dcg-migration` skill: SQL file, staging first, verify, then prod with approval
- No `DELETE`, `TRUNCATE`, or `DROP` without approval, even on staging
- Respect soft delete. Set `deleted_at` on classes; don't hard delete.

## Git
- Explain any destructive command before running it (`rm`, `mv`, `reset`, `rebase`, force anything)
- Approval to edit is not approval to commit. Ask separately.
- Never push. Jupiter pushes.
- Work on a branch, never directly on `main`
- Don't rename or restructure folders unless asked

## Scope
- Do what was asked. If you spot something else broken, list it at the end; don't fix it silently.
- Ask before adding a dependency
