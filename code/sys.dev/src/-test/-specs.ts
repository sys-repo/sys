/**
 * DevHarness visual specs.
 * @module
 */
import type { t } from './common.ts';
export const ns = 'sys.dev';
const nsEdu = `${ns}: catalog.edu`;

/**
 * Specs:
 */
export const Specs = {
  [`${nsEdu}`]: () => import('../catalog.edu/ui/-sample/-spec/-SPEC.tsx'),
  [`${nsEdu}: VideoRecorder`]: () => import('../catalog.edu/ui/ui.VideoRecorder/-spec/-SPEC.tsx'),
  [`${ns}: catalog.harness`]: () => import('../catalog.harness/-spec/-SPEC.tsx'),
  [`${ns}: sample`]: () => import('../ui/-sample/-spec/-SPEC.tsx'),
} as t.SpecImports;
