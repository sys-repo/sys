/// <reference types="vite/client" />

export type StripeRuntimeConfig = {
  readonly sessionUrl: string;
};

export type StripeRuntimeSession = {
  readonly publishableKey: string;
  readonly clientSecret: string;
};

const DEFAULT_SESSION_URL = '/-/stripe/payment-intent';

/** Resolve the runtime endpoint used by the spec to create a Stripe PaymentIntent. */
export function readRuntimeConfig(): StripeRuntimeConfig {
  const sessionUrl = import.meta.env.VITE_STRIPE_SESSION_URL ?? DEFAULT_SESSION_URL;
  return { sessionUrl } as const;
}

/** Fetch a fresh browser session from a runtime-owned Stripe endpoint. */
export async function loadRuntimeSession(args: {
  sessionUrl?: string;
  signal?: AbortSignal;
} = {}): Promise<StripeRuntimeSession> {
  const sessionUrl = args.sessionUrl ?? readRuntimeConfig().sessionUrl;
  const res = await fetch(sessionUrl, {
    method: 'POST',
    headers: { accept: 'application/json' },
    signal: args.signal,
  });

  const body = await res.json().catch(() => undefined) as Record<string, unknown> | undefined;
  if (!res.ok) {
    const message = typeof body?.error === 'string'
      ? body.error
      : `Stripe runtime session failed (${res.status})`;
    throw new Error(message);
  }

  const publishableKey = typeof body?.publishableKey === 'string' ? body.publishableKey : '';
  const clientSecret = typeof body?.clientSecret === 'string' ? body.clientSecret : '';

  if (!publishableKey || !clientSecret) {
    const message = typeof body?.error === 'string'
      ? body.error
      : 'Stripe runtime session response missing publishableKey/clientSecret.';
    throw new Error(message);
  }

  return { publishableKey, clientSecret } as const;
}
