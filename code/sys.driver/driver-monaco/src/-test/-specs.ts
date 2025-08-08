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
  [`${ns}: ui.MonacoEditor`]: () => import('../ui/ui.Editor.Monaco/-spec/-SPEC.tsx'),
  [`${ns}: ui.MonacoEditor ← (CRDT binding)`]: () => import('../ui/m.Crdt/-spec/-SPEC.tsx'),
  [`${ns}: ui.YamlEditor`]: () => import('../ui/ui.Editor.Yaml/-spec/-SPEC.tsx'),
  [`${ns}: Sample`]: () => import('../ui/-sample/-spec/-SPEC.tsx'),
} as t.SpecImports;
