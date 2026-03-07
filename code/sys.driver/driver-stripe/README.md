# @sys/driver-stripe
Stripe payment and UI driver primitives.

### Usage
```ts
import { PaymentElement } from 'jsr:@sys/driver-stripe/ui';
```

### DevHarness (.env)
Create a local `.env` in this package directory for isolated `ui.PaymentElement` DevHarness rendering.
This file may not exist after clone/pull (local-only secrets are not shared).

```env
STRIPE_SECRET_KEY="***"
VITE_STRIPE_PUBLISHABLE_KEY="***"
VITE_STRIPE_CLIENT_SECRET="***"
```

Use Stripe Dashboard sandbox values:
- `VITE_STRIPE_PUBLISHABLE_KEY`: `Developers` -> `API keys` -> `Publishable key`
- `STRIPE_SECRET_KEY`: `Developers` -> `API keys` -> `Secret key` (sandbox only; local script use)

Create `VITE_STRIPE_CLIENT_SECRET` locally with:
1. Set `STRIPE_SECRET_KEY` in `.env`
2. Run `deno task tmp`
3. Copy the printed `STRIPE_CLIENT_SECRET="..."` value into `VITE_STRIPE_CLIENT_SECRET`

`VITE_STRIPE_CLIENT_SECRET` in `.env` is for local component testing only. In production, create a fresh client secret server-side for each payment/session.

`STRIPE_SECRET_KEY` is script-only and must never be read in browser code. The browser DevHarness should read only `VITE_*` values via `import.meta.env`.

