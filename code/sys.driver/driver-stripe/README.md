# @sys/driver-stripe

Stripe payment and UI driver primitives.

### Usage

```ts
import { PaymentElement } from 'jsr:@sys/driver-stripe/ui';
```

### Runtime config

`ui.PaymentElement` follows Stripe's PaymentElement model: the browser receives a publishable key
and a fresh PaymentIntent `client_secret` from a runtime endpoint.

The browser bundle must not contain a baked PaymentIntent client secret. The browser never reads
`STRIPE_SECRET_KEY`; only the runtime process may read it.

For local/dev runtimes, keep Stripe secrets server-side. `deno task dev` exposes the default
session endpoint from the Vite server process via `vite.config.fixture.dev.ts`:

```env
STRIPE_SECRET_KEY="***"
STRIPE_PUBLISHABLE_KEY="***"
STRIPE_PAYMENT_AMOUNT="1099"
STRIPE_PAYMENT_CURRENCY="usd"
```

Use Stripe Dashboard sandbox values:

- `STRIPE_PUBLISHABLE_KEY`: `Developers` → `API keys` → `Publishable key`
- `STRIPE_SECRET_KEY`: `Developers` → `API keys` → `Secret key` (sandbox only; server/runtime use)

The local browser sample calls `VITE_STRIPE_SESSION_URL` at runtime. That endpoint should create a fresh
PaymentIntent server-side and return:

```json
{
  "publishableKey": "pk_test_...",
  "clientSecret": "pi_..._secret_..."
}
```

Do not use `VITE_STRIPE_CLIENT_SECRET`. `VITE_*` values are browser-facing and may be inlined into
built bundles.

### Dev fixture boundary

`vite.config.fixture.dev.ts` is a local runtime fixture, not the driver API and not a production
payment runtime. It exists to prove the correct seam:

```text
browser view → runtime session endpoint → Stripe PaymentIntent
```

Future Cell/runtime work should keep this seam and replace the fixture with a runtime-owned adapter.
The view should continue to ask for a fresh payment session; it should not learn Stripe secret keys,
order pricing rules, fulfillment, or webhook policy.

### Local verification

```sh
deno task verify
```

This checks the source, rebuilds `dist/`, scans the built bundle for baked Stripe credentials and
CLI/runtime-only modules, then runs the external browser gate:

```sh
deno task test:external
```

The external gate opens the local bundle in headless Chrome and fails on browser runtime exceptions
such as `unsupported runtime`. It requires Chrome/Chromium locally, or `CHROME_BIN` in CI.
