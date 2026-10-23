import { Env, Fs, Json, type t } from '../common.ts';

export async function createSession(args: t.StripeFixture.SessionArgs = {}) {
  const config = await loadConfig(args);
  if (!config.ok) return json(config.status, { error: config.error });

  try {
    const clientSecret = await createPaymentIntent(config.value);
    return json(200, {
      publishableKey: config.value.publishableKey,
      clientSecret,
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Stripe PaymentIntent failed.';
    return json(502, { error: message });
  }
}

async function loadConfig(args: t.StripeFixture.SessionArgs): Promise<
  | { readonly ok: true; readonly value: t.StripeFixture.Config }
  | { readonly ok: false; readonly status: number; readonly error: string }
> {
  const env = await Env.load({ cwd: args.cwd ?? Fs.cwd(), search: 'upward' });
  const secretKey = env.get('STRIPE_SECRET_KEY');
  const publishableKey = env.get('STRIPE_PUBLISHABLE_KEY');

  if (!secretKey || !publishableKey) {
    return {
      ok: false,
      status: 503,
      error:
        `Local Stripe runtime fixture is not configured. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY server-side.`,
    };
  }

  const amount = Number(env.get('STRIPE_PAYMENT_AMOUNT') || 1099);
  if (!Number.isInteger(amount) || amount <= 0) {
    return {
      ok: false,
      status: 400,
      error: 'Invalid STRIPE_PAYMENT_AMOUNT. Expected a positive integer in minor currency units.',
    };
  }

  const currency = (env.get('STRIPE_PAYMENT_CURRENCY') || 'usd').toLowerCase();
  if (!/^[a-z]{3}$/.test(currency)) {
    return {
      ok: false,
      status: 400,
      error: 'Invalid STRIPE_PAYMENT_CURRENCY. Expected a three-letter currency code.',
    };
  }

  return { ok: true, value: { secretKey, publishableKey, amount, currency } };
}

async function createPaymentIntent(config: t.StripeFixture.Config) {
  const body = new URLSearchParams({
    amount: String(config.amount),
    currency: config.currency,
    'automatic_payment_methods[enabled]': 'true',
  });

  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.secretKey}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const data = await res.json().catch(() => undefined) as Record<string, unknown> | undefined;
  if (!res.ok) {
    const error = data?.error as { message?: string } | undefined;
    throw new Error(error?.message ?? `Stripe API failed (${res.status}).`);
  }

  const clientSecret = typeof data?.client_secret === 'string' ? data.client_secret : '';
  if (!clientSecret) throw new Error('Stripe API response missing client_secret.');

  return clientSecret;
}

function json(status: number, body: unknown) {
  return new Response(Json.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
