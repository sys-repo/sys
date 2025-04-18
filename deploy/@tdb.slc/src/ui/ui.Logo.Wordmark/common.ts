import { type t } from '../common.ts';

export * from '../common.ts';
export { Theme } from '../ui.Logo.Canvas/mod.ts';

/**
 * Constants:
 */
export const DEFAULTS = {
  width: 90,
  get logo(): t.LogoKind {
    return 'SLC';
  },
} as const;
export const D = DEFAULTS;
