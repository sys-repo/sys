/**
 * DevHarness visual specs.
 * @module
 */
import type { t } from './common.ts';
export const ns = 'sys.dev';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: catalog: Harness`]: () => import('../catalog.harness/-spec/-SPEC.tsx'),
  [`${ns}: sample`]: () => import('../ui/-sample/-spec/-SPEC.tsx'),
} as t.SpecImports;
