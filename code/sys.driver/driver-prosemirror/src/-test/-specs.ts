/**
 * DevHarness visual specs.
 * @module
 */
import type { t } from './common.ts';
export const ns = 'driver.prosemirror';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: ui.TextEditor ← (CRDT binding)`]: () => import('../ui/ui.TextEditor/-spec/-SPEC.tsx'),
  [`${ns}: ui.TextPanel ← (CRDT binding)`]: () => import('../ui/ui.TextPanel/-spec/-SPEC.tsx'),
} as t.SpecImports;
