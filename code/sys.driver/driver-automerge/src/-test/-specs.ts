/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'driver.automerge';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: ui.Card`]: () => import('../ui/ui.Card/-spec/-SPEC.tsx'),
  [`${ns}: ui.Input.DocumentId`]: () => import('../ui/ui.Input.DocumentId/-spec/-SPEC.tsx'),
  [`${ns}: ui.TextEditor (ProseMirror)`]: () => import('../ui/ui.TextEditor/-spec/-SPEC.tsx'),
} as t.SpecImports;
