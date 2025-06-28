/**
 * @module
 * DevHarness visual specs.
 */
import type { t, pkg } from './common.ts';
export const ns = 'sys.driver.ui.react.monaco';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}.ui.MonacoEditor`]: () => import('../ui/ui.MonacoEditor/-spec/-SPEC.tsx'),
  [`${ns}: ui.MonacoEditor ← (CRDT binding)`]: () => import('../ui/m.Editor.Crdt/-spec/-SPEC.tsx'),
} as t.SpecImports;
