/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'sys.ui';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: files`]: () => import('../ui.react/ui.files/ui.InfoPanel/-spec/-SPEC.tsx'),
} as t.SpecImports;
