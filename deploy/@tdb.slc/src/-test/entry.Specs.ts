/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';

export const Specs = {
  'tdb.slc.ui.Home': () => import('../ui/Home/-SPEC.tsx'),
  'tdb.slc.ui.Canvas.Mini': () => import('../ui/Canvas.Mini/-SPEC.tsx'),
} as t.SpecImports;
