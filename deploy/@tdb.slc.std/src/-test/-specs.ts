/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'tdb.slc';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: Logo.Canvas`]: () => import('../ui/ui.Logo.Canvas/-SPEC.tsx'),
  [`${ns}: Logo.Wordmark`]: () => import('../ui/ui.Logo.Wordmark/-SPEC.tsx'),
  [`${ns}: Layout.Canvas`]: () => import('../ui/ui.Layout.Canvas/-spec/-SPEC.tsx'),
  [`${ns}: Video.Background`]: () => import('../ui/ui.Video.Background/-SPEC.tsx'),
} as t.SpecImports;
