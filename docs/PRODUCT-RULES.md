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
- A valid coupon skips Stripe entirely.
- Coupon codes are managed in the admin dashboard. Don't hardcode codes or put real codes in docs.

## Submission lifecycle

1. User fills the 4-step form. Status is `pending_payment`.
2. User pays via Stripe or applies a coupon. Status becomes `pending`.
3. Admin approves (row copied into `classes`, goes live) or rejects (with a `rejection_reason`).
4. Rejected submissions can be edited and resubmitted.
- Nothing goes live without admin approval. No auto-approve, ever.

## Listing content

- Categories follow AGD subject areas (Basic Sciences, Endodontics, Implants, etc.). The list lives in `SubmitClassForm.tsx`.
- Attendance type: `on-site`, `hybrid`, `remote`, `pre-recorded`
- Address is recommended, not required, for on-site and hybrid
- All 50 states are allowed. The client is Louisiana-based, so expect Gulf South listings.
- Classes whose `end_date` has passed are hidden from browse.
- Approved submissions older than one year past `end_date` get cleaned up by `/api/cleanup/expired-submissions`.

## Look and feel

- "Craigslist vibe." Plain, fast, functional. No animations, no hero images, no gradients.
- Mobile works as well as desktop.

## Parked (don't build unless asked)

- Email notifications (approval / rejection emails). There's a TODO in the reject route.
- Calendar view
- Anything that hosts course content or handles class registration
