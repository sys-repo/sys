/**
 * @module
 * Stripe Payment Element UI adapter.
 */
import type { t } from './common.ts';
import { PaymentElement as UI } from './ui.tsx';

export const PaymentElement: t.PaymentElement.Lib = { UI };
