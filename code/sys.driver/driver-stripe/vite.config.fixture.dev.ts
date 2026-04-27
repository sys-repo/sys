import { loadEnv, type Plugin } from 'npm:vite';

const STRIPE_SESSION_PATH = '/-/stripe/payment-intent';

type StripeDevRuntimeOptions = {
  readonly mode: string;
};

/**
 * Dev-only Stripe runtime endpoint.
 *
 * This is a local fixture for `deno task dev`, not production runtime code.
 * Secrets stay on the Vite server process. The browser receives only the
 * publishable key and a fresh PaymentIntent client_secret at request time.
 */
export function stripeDevRuntime(options: StripeDevRuntimeOptions): Plugin {
  return {
    name: 'sys.driver-stripe.dev-runtime',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(options.mode, Deno.cwd(), '');
      const read = (key: string) => Deno.env.get(key) ?? env[key];

      server.middlewares.use(STRIPE_SESSION_PATH, async (req, res) => {
        if (req.method !== 'POST') return respond(res, 405, { error: 'Method not allowed.' });

        const secretKey = read('STRIPE_SECRET_KEY');
        const publishableKey = read('STRIPE_PUBLISHABLE_KEY');
        if (!secretKey || !publishableKey) {
          return respond(res, 200, {
            configured: false,
            error: 'Local Stripe runtime is not configured. Set server-side Stripe environment variables in the Vite process.',
          });
        }

        try {
          const session = await createPaymentIntent({
            secretKey,
            publishableKey,
            amount: Number(read('STRIPE_PAYMENT_AMOUNT') ?? 1099),
            currency: read('STRIPE_PAYMENT_CURRENCY') ?? 'usd',
          });
          return respond(res, 200, session);
        } catch (cause) {
          const error = cause instanceof Error ? cause.message : 'Stripe PaymentIntent failed.';
          return respond(res, 502, { error });
        }
      });
    },
  };
}

async function createPaymentIntent(args: {
  readonly secretKey: string;
  readonly publishableKey: string;
  readonly amount: number;
  readonly currency: string;
}) {
  const body = new URLSearchParams({
    amount: String(args.amount),
    currency: args.currency,
    'automatic_payment_methods[enabled]': 'true',
  });

  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${args.secretKey}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const json = await res.json().catch(() => undefined) as Record<string, unknown> | undefined;
  if (!res.ok) {
    const error = json?.error as { message?: string } | undefined;
    throw new Error(error?.message ?? `Stripe API failed (${res.status}).`);
  }

  const clientSecret = typeof json?.client_secret === 'string' ? json.client_secret : '';
  if (!clientSecret) throw new Error('Stripe API response missing client_secret.');

  return { publishableKey: args.publishableKey, clientSecret } as const;
}

function respond(
  res: { statusCode: number; setHeader: (key: string, value: string) => void; end: (body?: string) => void },
  status: number,
  body: unknown,
) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}
