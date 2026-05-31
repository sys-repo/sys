/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'draft.shell';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: AppShell`]: () => import('../ui/ui.AppShell/-spec/-SPEC.tsx'),
  ['@sys/ui: Files<T>.Client']: () => import('../@sys/ui/Files/-spec/-SPEC.tsx'),
} as t.SpecImports;
