import type { t } from './common.ts';

/**
 * @module
 * Stripe UI adapters.
 */
export type StripeLib = {
  readonly PaymentElement: t.PaymentElement.Lib;
};
