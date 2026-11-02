# Code Conventions

## TypeScript
- Strict mode. No `any` in new code. There are 5 existing ones (for example `lib/stripe.ts`). Don't add more; fix them only when asked.
- Prefer explicit interfaces for props and DB rows.

## Next.js 14
- App Router only. No `pages/`.
- Server Components by default. Add `'use client'` only for state, effects, or browser APIs.
- API routes must be named `route.ts`. A file like `approve-route.ts` is dead code.
- House style: `params` / `searchParams` typed as a Promise and awaited, and `await cookies()`. It's a Next 15 habit, but it works in 14 and is already used across 11 route/page files. Match it for consistency; don't mix styles in one file.
- Use `next/link` and `next/image`. Images are `unoptimized: true` in `next.config.js`.

## Supabase
- Use `@supabase/ssr` only. `@supabase/auth-helpers-nextjs` is still in `package.json` but nothing imports it. Never import it.
- Browser: `createClient()` from `lib/supabase.ts`
- Server: `createServerClient(url, anonKey, { cookies })` built inside the component or handler
- Service role: `getSupabaseAdmin()` inside the handler

## Lazy init (this one broke Vercel builds twice)
```ts
// wrong: runs at build time, env vars aren't there
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// right
export async function POST(req: Request) {
  const stripe = getStripeServer();
}
```
Same rule for every Supabase client in route handlers.

## Styling
- Tailwind v3 utility classes. No CSS modules, no styled-components, no v4 syntax.
- Plain "Craigslist vibe" UI. Match existing components before inventing new styles.

## Forms
- The submit wizard is one component (`SubmitClassForm.tsx`) with `validateStep(n)` per step. Add validation there, not in a new file.
- Keep input `id`s stable. Playwright selects by them.

## Before calling something done
- `npx tsc --noEmit` passes
- `npm run build` passes
- Relevant Playwright spec passes against staging
