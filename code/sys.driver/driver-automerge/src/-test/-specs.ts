/**
 * DevHarness visual specs.
 * @module
 */
import type { t } from './common.ts';
export const ns = 'driver.automerge';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: ui.Card ← (Primitive Sample)`]: () => import('../ui/ui.Card/-spec/-SPEC.tsx'),
  [`${ns}: ui.Repo`]: () => import('../ui/ui.Repo/-spec/-SPEC.tsx'),
  [`${ns}: ui.DocumentId`]: () => import('../ui/ui.DocumentId/-spec/-SPEC.tsx'),
  [`${ns}: ui.Layout`]: () => import('../ui/ui.Layout/-spec/-SPEC.tsx'),
  [`${ns}: ui.Binary`]: () => import('../ui/ui.Binary/-spec/-SPEC.tsx'),
} as t.SpecImports;
