import Stripe from 'stripe';

export function getStripeServer() {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
  }

  return new Stripe(key);
}
