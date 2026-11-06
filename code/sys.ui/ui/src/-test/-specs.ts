/**
 * @module
 * DevHarness visual specs.
 */
import { DevArgs, type t } from './common.ts';
import { SpecNames } from '../../-sample/passkey/-u.navigation.ts';
export const ns = 'sys.ui';

/**
 * Specs:
 */
export const Specs = {
  [`${ns}: Files.InfoPanel`]: () => import('../ui.react/ui.files/ui.InfoPanel/-spec/-SPEC.tsx'),
  [`${ns}: Files.InfoPanel.Config`]: () =>
    import('../ui.react/ui.files/ui.InfoPanel.Config/-spec/-SPEC.tsx'),
  [SpecNames.sample]: () => import('../../-sample/passkey/ui/-spec.integration/-SPEC.tsx'),
} as t.SpecImports;

/** Secondary specimens remain lazy and are omitted from the main index. */
const secondary: t.SpecImports = {
  [SpecNames.view]: () => import('../../-sample/passkey/ui/-spec/-SPEC.tsx'),
};
const addressable: t.SpecImports = { ...Specs, ...secondary };

/** Select addressable specs without adding secondary specimens to the index. */
export function specsFor(location: string | URL): t.SpecImports {
  const url = DevArgs.Url.navigate.formatDevFlag({ location });
  const field = url.searchParams.get('dev') ?? '';
  const matches = DevArgs.Url.moduleMatches(field, addressable);
  const isSecondary = matches.length === 1 && matches[0].namespace in secondary;
  return isSecondary ? addressable : Specs;
}
