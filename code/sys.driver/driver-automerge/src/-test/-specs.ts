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
  [`${ns}: ui.Card ← (primitive sample)`]: () => import('../ui/ui.Card/-spec/-SPEC.tsx'),
  [`${ns}: ui.Repo`]: () => import('../ui/ui.Repo/-spec/-SPEC.tsx'),
  [`${ns}: ui.Repo ← (worker)`]: () => import('../ui/ui.Repo/-spec.worker/-SPEC.tsx'),
  [`${ns}: ui.Document ← (worker)`]: () => import('../ui/ui.Document/-spec/-SPEC.tsx'),
  [`${ns}: ui.Document.Id`]: () => import('../ui/ui.DocumentId/-spec/-SPEC.tsx'),
  [`${ns}: ui.Layout`]: () => import('../ui/ui.Layout/-spec/-SPEC.tsx'),
  [`${ns}: ui.Binary`]: () => import('../ui/ui.Binary/-spec/-SPEC.tsx'),
} as t.SpecImports;
