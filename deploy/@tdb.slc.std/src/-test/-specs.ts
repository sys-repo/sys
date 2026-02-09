/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'sys.🐷';

/**
 * Specs:
 */
export const Specs = {
  'tdb.slc.ui.Logo.Canvas': () => import('../ui/ui.Logo.Canvas/-SPEC.tsx'),
  'tdb.slc.ui.Logo.Wordmark': () => import('../ui/ui.Logo.Wordmark/-SPEC.tsx'),
} as t.SpecImports;
