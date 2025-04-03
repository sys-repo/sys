/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';

export const Specs = {
  'tdb.slc.entry.Landing-1': () => import('../ui/ui.Landing-1/-SPEC.tsx'),
  'tdb.slc.entry.Landing-2': () => import('../ui/ui.Landing-2/-SPEC.tsx'),
  'tdb.slc.entry.Landing-3': () => import('../ui/ui.Landing-3/-SPEC.tsx'),

  'tdb.slc.ui.Layout': () => import('../ui/ui.Layout/-SPEC.tsx'),

  'tdb.slc.ui.Logo': () => import('../ui/ui.Logo/-SPEC.tsx'),
  'tdb.slc.ui.Logo.Canvas': () => import('../ui/ui.Logo.Canvas/-SPEC.tsx'),
  'tdb.slc.ui.Video.Background': () => import('../ui/ui.Video.Background/-SPEC.tsx'),

  'tdb.slc.videos: (index)': () => import('../-sample/-ui.Videos/-SPEC.tsx'),
} as t.SpecImports;
