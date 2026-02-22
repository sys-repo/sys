import { type t, describe, it, expect, expectTypeOf, Is, Obj, Str } from '../../../-test.ts';
import { PaymentElement } from '../mod.ts';

describe('Stripe.PaymentElement', () => {
  it('API', async () => {
    const m = await import('@sys/driver-stripe/ui');
    expect(m.PaymentElement).to.equal(PaymentElement);
  });
});
