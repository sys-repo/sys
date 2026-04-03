/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'tdb.slc.data';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: ui.HttpOrigin`]: () => import('../ui/ui.HttpOrigin/-spec/-SPEC.tsx'),
} as t.SpecImports;
