/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';

export const Specs = {
  'tdb.slc.ui.Foo': () => import('../ui/Foo/-SPEC.tsx'),
} as t.SpecImports;
