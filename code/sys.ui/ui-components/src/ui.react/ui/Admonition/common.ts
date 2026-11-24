import { Pkg, pkg, type t } from '../common.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Admonition';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  kind: 'tip' satisfies t.Admonition.Kind,
  radius: 4 satisfies t.Pixels,
  selectable: true,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
