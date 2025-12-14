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
  [`${edu}: -sample-1 ← (yaml editor)`]: () => import('../ui/-sample.editor-1/-spec/-SPEC.tsx'),
  [`${edu}: -sample-2 ← (yaml editor)`]: () => import('../ui/-sample.editor-2/-spec/-SPEC.tsx'),
  [`${edu}: VideoRecorder`]: () => import('../ui/ui.VideoRecorder/-spec/-SPEC.tsx'),
  [`${ns}: TMP 🐷`]: () => import('../ui/-sample.tmp/-spec/-SPEC.tsx'),
} as t.SpecImports;
