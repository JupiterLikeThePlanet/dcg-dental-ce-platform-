# Environments

Names only. Never write secret values into this file or any other tracked file.

## Supabase projects

| Env | Project ID | Holds |
|---|---|---|
| Production | `vropbtrpnoxmavixlvsb` | real users and listings |
| Staging | `duqgdsrvaxucbckqkygo` | test data, safe to wipe |

## Env vars

| Var | Public? | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **no** | bypasses RLS |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | yes | `pk_test_` or `pk_live_` |
| `STRIPE_SECRET_KEY` | **no** | `sk_test_` or `sk_live_` |
| `STRIPE_WEBHOOK_SECRET` | **no** | different per webhook endpoint |
| `CRON_SECRET` | **no** | guards the cleanup route. Vercel Cron sends it automatically as a Bearer header when set in the project. |

## Where each environment points

- **Local (`.env.local`):** staging Supabase + Stripe test mode is the active block. Prod values sit commented out in the same file. Don't uncomment them. `TODO: move prod values out of this file entirely.`
- **Vercel Production:** prod Supabase + Stripe live. `TODO: verify` in the Vercel dashboard.
- **Vercel Preview:** should be staging + Stripe test. `TODO: verify`.

## Stripe webhooks
- Endpoint path: `/api/webhooks/stripe`
- Test and live mode each have their own endpoint and their own `whsec_` secret
- `TODO: verify` the live endpoint is registered for dcgdental.com

## Email
- Auth emails (verify signup, reset password) use Supabase's built-in templates, branded green `#166534`, edited in the Supabase dashboard
- No transactional email service is wired into the code
- `TODO: verify` whether Resend SMTP was set as Supabase's custom SMTP in prod. Older notes say yes, newer ones say built-in only.

## Domain
- dcgdental.com. DNS through Squarespace with Google nameservers. `TODO: verify` current setup.
- Supabase Auth Site URL and redirect URLs must match the live domain or verification links break.
