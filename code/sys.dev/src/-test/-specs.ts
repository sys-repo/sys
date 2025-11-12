/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'sys.dev';

import { Specs as Edu } from '../catalog.edu/-test/-specs.ts';

/**
 * Specs:
 */
export const Specs = {
  ...Edu,
  [`${ns}: -sample`]: () => import('../ui/-sample/-spec/-SPEC.tsx'),
} as t.SpecImports;
