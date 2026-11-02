# Product Rules

Business logic the code can't explain on its own. If a request conflicts with a rule here, stop and ask.

## What the product is

- A discovery directory for dental continuing education classes
- Not a course host, not a registration system, not a payment processor for classes
- Every listing links out to the provider's own `registration_url`

## Roles

- **Public visitor:** browse, search, filter, view class details. No account needed.
- **Signed-up user (provider):** submit listings, pay or use a coupon, track status, edit and resubmit
- **Admin:** approve or reject submissions, manage coupons. Set by `users.is_admin = true`.
- Production admins: Jupiter and Russell. Don't add admins without being asked.

## Listing fee

- $5, one time, per listing. Not a subscription.
- The fee exists mostly to stop spam, not to make money. Don't add upsells.
- A valid coupon skips Stripe entirely. Valid = active, not past `expires_at`, under `max_uses`.
- Coupon codes are managed in the admin dashboard (create, list, delete; no edit). Don't hardcode codes or put real codes in docs.

## Submission lifecycle

1. User opens `/submit` and hits the payment gate first: pay $5 via Stripe, or enter a coupon. Admins skip the gate.
2. User fills the 4-step form. On submit, the row is inserted directly as `pending`.
   - One Stripe payment creates exactly one submission. A used payment can't be reused.
   - If a user pays and leaves before submitting, the payment is only usable by returning to the same `/submit?paid=…` URL. There's no "unused payment" recovery yet.
3. Admin approves (row copied into `classes`, goes live) or rejects (`rejection_reason` is optional).
4. Rejected or pending submissions can be edited and resubmitted with no new charge.
- `pending_payment` is a legacy status for older rows. Editing one from the dashboard offers payment again (Stripe or coupon); the webhook and `/submit/success` then flip it to `pending`.
- Nothing new goes live without admin approval. No auto-approve, ever.
- **Open question:** editing an *approved* submission currently updates the live listing immediately, with no re-review (`app/api/checkout/route.ts`). `TODO: decide` with Russell whether that's intended.

## Listing content

- Categories follow AGD subject areas (Basic Sciences, Endodontics, Implants, etc.). The list lives in `SubmitClassForm.tsx`.
- Attendance type: `on-site`, `hybrid`, `remote`, `pre-recorded`
- Street address is recommended, not required, for on-site and hybrid. City and state are required for every attendance type, remote included.
- All 50 states are allowed (no DC). The form defaults to `LA`; the client is Louisiana-based, so expect Gulf South listings.
- Classes whose `end_date` has passed are hidden from browse.
- Approved submissions older than one year past `end_date` get cleaned up by `/api/cleanup/expired-submissions`.

## Look and feel

- "Craigslist vibe." Plain, fast, functional. No animations, no hero images, no gradients.
- Mobile works as well as desktop.

## Parked (don't build unless asked)

- Email notifications (approval / rejection emails). There's a TODO in the reject route. Note: `/submit/success` currently tells users "You'll receive an email when your class is approved," which isn't true yet.
- Calendar view
- Anything that hosts course content or handles class registration
