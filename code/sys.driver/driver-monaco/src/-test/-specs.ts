/**
 * DevHarness visual specs.
 * @module
 */
import type { t } from './common.ts';
export const ns = 'driver.monaco';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: ui.MonacoEditor`]: () => import('../ui/ui.MonacoEditor/-spec/-SPEC.tsx'),
  [`${ns}: ui.MonacoEditor ← (CRDT binding)`]: () => import('../ui/m.Crdt/-spec/-SPEC.tsx'),
  [`${ns}: ui.Dev.Editor`]: () => import('../ui/ui.Dev/-spec.editor/-SPEC.tsx'),
  [`${ns}: Sample`]: () => import('../ui/-sample/-spec/-SPEC.tsx'),
} as t.SpecImports;
