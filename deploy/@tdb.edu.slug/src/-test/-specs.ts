/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'tdb.edu.slug';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: Layout.TreeSplit`]: () => import('../ui/ui.Layout.TreeSplit/-spec/-SPEC.tsx'),
} as t.SpecImports;
