/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'driver.automerge';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: sample`]: () => import('../ui/-sample/-spec/-SPEC.tsx'),
} as t.SpecImports;
