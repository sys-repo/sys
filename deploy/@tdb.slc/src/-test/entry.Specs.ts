/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';

export const Specs = {
  '-tmp': () => import('../ui/-tmp/-SPEC.tsx'),
  'tdb.slc.ui.Landing': () => import('../ui/Landing/-SPEC.tsx'),
  'tdb.slc.ui.Canvas.Mini': () => import('../ui/Canvas.Mini/-SPEC.tsx'),
} as t.SpecImports;
