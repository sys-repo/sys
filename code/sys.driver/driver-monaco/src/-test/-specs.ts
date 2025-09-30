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
  [`${ns}: ui.MonacoEditor ← (binding: CRDT)`]: () => import('../ui/m.Crdt/-spec/-SPEC.tsx'),
  [`${ns}: ui.YamlEditor`]: () => import('../ui/ui.YamlEditor/-spec/-SPEC.tsx'),
  [`${ns}: ui.YamlEditor.Footer`]: () => import('../ui/ui.YamlEditor.Footer/-spec/-SPEC.tsx'),
  [`${ns}: Sample`]: () => import('../-sample/-spec/-SPEC.tsx'),
} as t.SpecImports;
