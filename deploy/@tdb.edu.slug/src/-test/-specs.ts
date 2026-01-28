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
  [`${ns}: ui.SlugSheet`]: () => import('../ui/ui.SlugSheet/-spec/-SPEC.tsx'),
  [`${ns}: ui.SlugSheetStack`]: () => import('../ui/ui.SlugSheetStack/-spec/-SPEC.tsx'),
  [`${ns}: ui.TreeHost`]: () => import('../ui/ui.TreeHost/-spec/-SPEC.tsx'),
  [`${ns}: ui.driver.SlugPlayback`]: () => import('../ui/ui.SlugPlaybackDriver/-spec/-SPEC.tsx'),
  [`${ns}: ui.driver.SlugKb`]: () => import('../ui/ui.SlugKbDriver/-spec/-SPEC.tsx'),
} as t.SpecImports;
