import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { Theme } from '../ui.Logo.Canvas/mod.ts';

/**
 * Constants:
 */
const name = 'Logo.Wordmark';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  width: 90,
  get logo(): t.LogoKind {
    return 'SLC';
  },
} as const;
export const D = DEFAULTS;
