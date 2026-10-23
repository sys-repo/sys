/**
 * @module
 * Stripe Payment Element UI adapter.
 */
import type { t } from './common.ts';
import { PaymentElement as UI } from './ui.tsx';

/** React adapter for rendering Stripe's Payment Element. */
export const PaymentElement: t.PaymentElement.Lib = { UI };
