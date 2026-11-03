/**
 * Paywall switch. Server-only: read it in Server Components and route
 * handlers, then pass the result down as a prop. Never read it in the browser,
 * where it can't be trusted.
 *
 * On only when PAYWALL_ENABLED is exactly "true". "false", unset, or a typo
 * all mean off, so listings are free and coupons are hidden.
 * The Stripe, coupon and webhook code stays in place for when it's turned back on.
 */
export function isPaywallEnabled(): boolean {
  return process.env.PAYWALL_ENABLED === 'true';
}
