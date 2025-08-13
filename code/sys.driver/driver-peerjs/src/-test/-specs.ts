/**
 * DevHarness visual specs.
 * @module
 */
import type { t } from './common.ts';
export const ns = 'driver.peerjs';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: ui.Avatar`]: () => import('../ui/ui.Avatar/-spec/-SPEC.tsx'),
  [`${ns}: ui.Sample`]: () => import('../ui/ui.Sample/-spec/-SPEC.tsx'),
} as t.SpecImports;
