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
  [`${ns}: ui.TextPanel (CRDT)`]: () => import('../ui/ui.TextPanel/-spec/-SPEC.tsx'),
  [`${ns}: ui.TextEditor (CRDT)`]: () => import('../ui/ui.TextEditor/-spec/-SPEC.tsx'),
} as t.SpecImports;
