/**
 * DevHarness visual specs.
 * @module
 */
import type { t } from './common.ts';
import { SpecsExternal } from './entry.Specs.External.ts';

/**
 * Module Components:
 */
export const SpecsComponents = {
  'tdb.slc.entry.Landing-1': () => import('../ui/ui.Landing-1/-SPEC.tsx'),
  'tdb.slc.entry.Landing-2': () => import('../ui/ui.Landing-2/-SPEC.tsx'),
  'tdb.slc.entry.Landing-3': () => import('../ui/ui.Landing-3/-SPEC.tsx'),

  'tdb.slc.ui.Layout': () => import('../ui/ui.Layout/-SPEC.tsx'),
  'tdb.slc.ui.Layout.Canvas': () => import('../ui/ui.Layout.Canvas/-spec/-SPEC.tsx'),
  'tdb.slc.ui.Logo.Canvas': () => import('../ui/ui.Logo.Canvas/-SPEC.tsx'),
  'tdb.slc.ui.Logo.Wordmark': () => import('../ui/ui.Logo.Wordmark/-SPEC.tsx'),

  'tdb.slc.ui.FadeText': () => import('../ui/ui.FadeText/-SPEC.tsx'),
  'tdb.slc.ui.Image': () => import('../ui/ui.Image/-SPEC.tsx'),
  'tdb.slc.ui.MenuList': () => import('../ui/ui.MenuList/-spec/-SPEC.tsx'),
  'tdb.slc.ui.TooSmall': () => import('../ui/ui.TooSmall/-SPEC.tsx'),
  'tdb.slc.ui.Video.Background': () => import('../ui/ui.Video.Background/-SPEC.tsx'),

  'tdb.slc.ui.Canvas.Project': () => import('../ui/ui.Canvas.Project/-spec/-SPEC.tsx'),
  'tdb.slc.ui.Canvas.Editor': () => import('../ui/ui.Canvas.Editor/-spec/-SPEC.tsx'),
} as t.SpecImports;

/**
 * Content Modules:
 */
export const SpecsContent = {
  'tdb.slc.content.videos: (index)': () => import('../ui.content/-sample/ui.Videos/-SPEC.tsx'),
  'tdb.slc.content.ui.ConceptPlayer': () => import('../ui.content/ui/ui.ConceptPlayer/-SPEC.tsx'),
  'tdb.slc.content.ui.CanvasSlug': () => import('../ui.content/ui/ui.CanvasSlug/-SPEC.tsx'),
  'tdb.slc.content.ui.Playlist': () => import('../ui.content/ui/ui.Playlist/-spec/-SPEC.tsx'),

  'tdb.slc.content: Programme': () => import('../ui.content/ui.Programme/-spec/-SPEC.tsx'),
  'tdb.slc.content: Programme.Section': () =>
    import('../ui.content/ui.Programme/-spec.Section/-SPEC.tsx'),
} as t.SpecImports;

/**
 * Specs:
 */
export const Specs = {
  ...SpecsComponents,
  ...SpecsContent,
  ...SpecsExternal,
} as t.SpecImports;
export { SpecsExternal };
