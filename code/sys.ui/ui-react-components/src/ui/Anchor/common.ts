import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';

type P = t.Anchor.Props;

/**
 * Constants:
 */
const name = 'Anchor';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  enabled: true satisfies P['enabled'],
  opacity: 0.3 as t.Percent,
  target: undefined satisfies P['target'],
  download: false satisfies P['download'],
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
