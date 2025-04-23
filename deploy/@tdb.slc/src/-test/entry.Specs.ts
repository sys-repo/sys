/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
import { SpecsExternal } from './entry.Specs.External.ts';

/**
 * Module Components
 */
export const SpecsComponents = {
  'tdb.slc.entry.Landing-1': () => import('../ui/ui.Landing-1/-SPEC.tsx'),
  'tdb.slc.entry.Landing-2': () => import('../ui/ui.Landing-2/-SPEC.tsx'),
  'tdb.slc.entry.Landing-3': () => import('../ui/ui.Landing-3/-SPEC.tsx'),

  'tdb.slc.ui.Layout': () => import('../ui/ui.Layout/-SPEC.tsx'),
  'tdb.slc.ui.Logo.Wordmark': () => import('../ui/ui.Logo.Wordmark/-SPEC.tsx'),
  'tdb.slc.ui.Logo.Canvas': () => import('../ui/ui.Logo.Canvas/-SPEC.tsx'),
  'tdb.slc.ui.FadeText': () => import('../ui/ui.FadeText/-SPEC.tsx'),
  'tdb.slc.ui.Image': () => import('../ui/ui.Image/-SPEC.tsx'),
  'tdb.slc.ui.TooSmall': () => import('../ui/ui.TooSmall/-SPEC.tsx'),
  'tdb.slc.ui.Video.Background': () => import('../ui/ui.Video.Background/-SPEC.tsx'),

  'tdb.slc.content.videos: (index)': () => import('../ui.content/-sample/ui.Videos/-SPEC.tsx'),
  'tdb.slc.content.ConceptPlayer': () => import('../ui.content/ui/ui.ConceptPlayer/-SPEC.tsx'),
  'tdb.slc.content.CanvasSlug': () => import('../ui.content/ui/ui.CanvasSlug/-SPEC.tsx'),
} as t.SpecImports;

/**
 * Specs:
 */
export const Specs = { ...SpecsComponents, ...SpecsExternal } as t.SpecImports;
export { SpecsExternal };
