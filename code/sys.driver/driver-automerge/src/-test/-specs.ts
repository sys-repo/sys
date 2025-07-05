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
  [`${ns}: ui.Card`]: () => import('../ui/ui.Card/-spec/-SPEC.tsx'),
  [`${ns}: ui.Repo`]: () => import('../ui/ui.Repo/-spec/-SPEC.tsx'),
  [`${ns}: ui.DocumentId`]: () => import('../ui/ui.DocumentId/-spec/-SPEC.tsx'),
  [`${ns}: ui.BinaryFile`]: () => import('../ui/ui.BinaryFile/-spec/-SPEC.tsx'),
} as t.SpecImports;
