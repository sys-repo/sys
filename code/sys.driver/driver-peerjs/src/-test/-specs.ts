/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'driver.peerjs';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: ui.Sample`]: () => import('../ui/ui.Sample/-spec/-SPEC.tsx'),
} as t.SpecImports;
