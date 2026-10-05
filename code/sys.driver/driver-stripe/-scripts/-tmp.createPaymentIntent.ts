import { Env } from '@sys/fs';

type CreatePaymentIntentArgs = {
  amount?: number;
  currency?: string;
};

export async function createPaymentIntent() {
  const env = await Env.load();
  const secretKey = env.get('STRIPE_SECRET_KEY') ?? '';

  if (!secretKey) throw new Error('Missing STRIPE_SECRET_KEY in .env');

  const clientSecret = await createPaymentIntentClientSecret(secretKey, {
    amount: 500,
    currency: 'usd',
  });

  console.info();
  console.info('# Runtime-only PaymentIntent client secret (do not prefix with VITE_)');
  console.info(`STRIPE_CLIENT_SECRET="${clientSecret}"`);
  console.info();
}

/**
 * Creates a sandbox PaymentIntent and returns its client secret for local DevHarness usage.
 */
export async function createPaymentIntentClientSecret(
  secretKey: string,
  args: CreatePaymentIntentArgs = {},
) {
  const amount = args.amount ?? 500;
  const currency = (args.currency ?? 'usd').toLowerCase();

  const body = new URLSearchParams({
    amount: String(amount),
    currency,
    'automatic_payment_methods[enabled]': 'true',
  });

  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message ?? `Stripe request failed (${res.status})`;
    throw new Error(msg);
  }

  const clientSecret = json?.client_secret;
  if (typeof clientSecret !== 'string' || !clientSecret) {
    throw new Error('Stripe response missing client_secret');
  }

  return clientSecret;
}
