# @sys/driver-stripe
Stripe payment and UI driver primitives.

### Usage
```ts
import { PaymentElement } from 'jsr:@sys/driver-stripe/ui';
```

### DevHarness (.env)
Local values for rendering `ui.PaymentElement` in isolation.

```env
STRIPE_PUBLISHABLE_KEY="****"
STRIPE_CLIENT_SECRET="****"
```

Use Stripe Dashboard sandbox values:
- `STRIPE_PUBLISHABLE_KEY`: `Developers` -> `API keys` -> `Publishable key`
- `STRIPE_CLIENT_SECRET`: copy from a sandbox `PaymentIntent` or `Checkout Session` created for local harness testing

`STRIPE_CLIENT_SECRET` in `.env` is for local component testing only. In production, create a fresh client secret server-side for each payment/session.
