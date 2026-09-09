import type { t } from './common.ts';

/** Aggregated Stripe UI adapter surface. */
export type StripeLib = {
  /** React adapter for mounting Stripe's Payment Element. */
  readonly PaymentElement: t.PaymentElement.Lib;
};
