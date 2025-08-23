/**
 * DevHarness visual specs.
 * @module
 */
import type { t } from './common.ts';
export const ns = 'sys.ui.factory';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: HostAdapter → React`]: () => import('../ui/-sample.react/-spec/-SPEC.tsx'),
} as t.SpecImports;
