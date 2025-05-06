/**
 * @module
 * DevHarness visual specs.
 */
import type { t, pkg } from './common.ts';
export const ns = 'sys.driver.ui.react.monaco';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}.tmp`]: () => import('../ui/ui.tmp/-spec/-SPEC.tsx'),
} as t.SpecImports;
