/**
 * @module
 * Stripe UI adapters.
 */
import type { t } from './common.ts';
import { PaymentElement } from '../ui.PaymentElement/mod.ts';

/** Aggregated Stripe UI adapters exposed by this package. */
export const Stripe: t.StripeLib = { PaymentElement };
