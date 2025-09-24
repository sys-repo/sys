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
  [`${ns}: ui.Editor.Yaml ← (CRDT binding)`]: () => import('../ui/ui.Editor.Yaml/-spec/-SPEC.tsx'),
  [`${ns}: ui.Editor.Yaml.Footer`]: () => import('../ui/ui.Editor.Yaml.Footer/-spec/-SPEC.tsx'),
  [`${ns}: Sample`]: () => import('../-sample/-spec/-SPEC.tsx'),
} as t.SpecImports;
