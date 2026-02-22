import { describe, expect, it } from '../../../-test.ts';
import { PaymentElement } from '../../ui.PaymentElement/mod.ts';
import { Stripe } from '../mod.ts';

describe(`Stripe`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-stripe/ui');
    expect(m.Stripe).to.equal(Stripe);
    expect(m.PaymentElement).to.equal(PaymentElement);
  });
});
