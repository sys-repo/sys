# @sys/driver-stripe

Stripe payment and UI driver primitives.

```ts
import { PaymentElement } from 'jsr:@sys/driver-stripe/ui';
```

## Local development

Start the Stripe runtime fixture:

```sh
deno task fixture
```

Start the Vite dev server:

```sh
deno task dev
```

Tasks:

- `fixture` → Stripe runtime fixture, `http://127.0.0.1:9090/`
- `dev` → Vite dev server, pointed at the fixture endpoint
- `build` → bundles the browser with the fixture endpoint URL
- `serve` → standard Vite preview for `dist/`

Both `dev` and `build` point the browser at:

```text
http://127.0.0.1:9090/-/stripe/payment-intent
```

Required local server-side environment:

```env
STRIPE_SECRET_KEY="***"
STRIPE_PUBLISHABLE_KEY="***"
```

Optional:

```env
STRIPE_PAYMENT_AMOUNT="1099"
STRIPE_PAYMENT_CURRENCY="usd"
STRIPE_FIXTURE_PORT="9090"
```

## Runtime boundary

`PaymentElement` is browser-side only. It calls a runtime endpoint for:

```json
{
  "publishableKey": "pk_test_...",
  "clientSecret": "pi_..._secret_..."
}
```

The browser bundle must not contain `STRIPE_SECRET_KEY` or a baked PaymentIntent client secret.
Do not use `VITE_STRIPE_CLIENT_SECRET`.

```text
browser view → runtime session endpoint → Stripe PaymentIntent
```

`@sys/driver-stripe/server` is only the local fixture/proof runtime, not the production payment adapter.

## Verification

```sh
deno task verify
```
