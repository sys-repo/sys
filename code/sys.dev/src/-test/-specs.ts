/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'sys.dev';
const edu = `${ns}: catalog.edu`;

/**
 * Specs:
 */
export const Specs = {
  [`${edu}: -sample-1 ← (yaml editor)`]: () =>
    import('../catalog.edu/ui/-sample.editor-1/-spec/-SPEC.tsx'),
  [`${edu}: -sample-2 ← (yaml editor)`]: () =>
    import('../catalog.edu/ui/-sample.editor-2/-spec/-SPEC.tsx'),
  [`${edu}: SlugHarness`]: () => import('../catalog.edu/ui/ui.SlugHarness/-spec/-SPEC.tsx'),
  [`${edu}: VideoRecorder`]: () => import('../catalog.edu/ui/ui.VideoRecorder/-spec/-SPEC.tsx'),
  [`${edu}: Timestamps`]: () => import('../catalog.edu/ui/ui.Timestamps/-spec/-SPEC.tsx'),

  [`${ns}: -sample`]: () => import('../ui/-sample/-spec/-SPEC.tsx'),
} as t.SpecImports;
