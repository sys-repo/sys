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
  [`${ns}: ui.Error.Validation`]: () => import('../ui/ui.Error.Validation/-spec/-SPEC.tsx'),
  [`${ns}: HostAdapter → React`]: () => import('../ui/-sample.react/-spec/-SPEC.tsx'),
  [`${ns}: tmpl → Catalog`]: () => import('../ui/-sample.tmpl/-spec/-SPEC.tsx'),
} as t.SpecImports;
