/**
 * @module
 * DevHarness visual specs.
 */
import type { t } from './common.ts';
export const ns = 'sys.ui';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: -sample/passkey`]: () => import('../../-sample/passkey/ui/-spec/-SPEC.tsx'),
  [`${ns}: Files.InfoPanel`]: () => import('../ui.react/ui.files/ui.InfoPanel/-spec/-SPEC.tsx'),
  [`${ns}: Files.InfoPanel.Config`]: () =>
    import('../ui.react/ui.files/ui.InfoPanel.Config/-spec/-SPEC.tsx'),
} as t.SpecImports;
