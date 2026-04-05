/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'slc.data';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: ui.HttpOrigin`]: () => import('../ui/ui.HttpOrigin/-spec/-SPEC.tsx'),
  [`${ns}: dev/ui.HttpDataCards`]: () => import('../ui/-dev/ui.HttpDataCards/-spec/-SPEC.tsx'),
} as t.SpecImports;
