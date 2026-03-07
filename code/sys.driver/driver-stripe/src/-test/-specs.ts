/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'sys.driver.stripe';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: ui.PaymentElement`]: () => import('../ui/ui.PaymentElement/-spec/-SPEC.tsx'),
} as t.SpecImports;
