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

  'tdb.slc.ui.Logo.Wordmark': () => import('../ui/ui.Logo.Wordmark/-SPEC.tsx'),
  'tdb.slc.ui.Logo.Canvas': () => import('../ui/ui.Logo.Canvas/-SPEC.tsx'),
  'tdb.slc.ui.Video.Background': () => import('../ui/ui.Video.Background/-SPEC.tsx'),
  'tdb.slc.ui.TooSmall': () => import('../ui/ui.TooSmall/-SPEC.tsx'),

  'tdb.slc.content.videos: (index)': () => import('../ui.Content/-sample/ui.Videos/-SPEC.tsx'),
  'tdb.slc.content.CanvasSlug': () => import('../ui.Content/ui/ui.CanvasSlug/-SPEC.tsx'),
} as t.SpecImports;
