# @sys/driver-stripe

React bindings for Stripe's Payment Element, with a separate local runtime fixture.

## Render the Payment Element

`/ui` exports `PaymentElement.UI`. Your application fetches a session from its server and passes the
publishable key and current client secret to the component:

```tsx
import { PaymentElement } from 'jsr:@sys/driver-stripe/ui';

type Session = { publishableKey: string; clientSecret: string };

export function PaymentForm({ session }: { session: Session }) {
  return (
    <PaymentElement.UI
      publishableKey={session.publishableKey}
      clientSecret={session.clientSecret}
    />
  );
}
```

This requires a browser, React TSX tooling that resolves JSR imports, and access to Stripe.js. The
component mounts the element and cleans it up on teardown; it does not fetch the session or complete
a payment workflow. The application owns session acquisition and payment confirmation. See the
[API documentation](https://jsr.io/@sys/driver-stripe/doc) for configuration and callbacks.

## Local development

From this package's checkout, first configure the fixture's server-side environment:

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

Then start the Stripe runtime fixture:

```sh
deno task fixture
```

In a second terminal, start the Vite dev server from the same package:

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

## Runtime boundary

`PaymentElement.UI` is browser-side only. The application—not the component—calls the session
endpoint for:

```json
{
  "publishableKey": "pk_test_...",
  "clientSecret": "pi_..._secret_..."
}
```

The browser bundle must not contain `STRIPE_SECRET_KEY` or a baked PaymentIntent client secret. Do
not use `VITE_STRIPE_CLIENT_SECRET`.

```text
browser view → runtime session endpoint → Stripe PaymentIntent
```

`@sys/driver-stripe/server` is only the local fixture/proof runtime, not the production payment
adapter.

## Verification

```sh
deno task verify
```
