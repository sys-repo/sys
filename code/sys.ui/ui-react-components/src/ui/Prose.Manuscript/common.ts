import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { KeyValue } from '../KeyValue/mod.ts';
export { WebFonts, ETBook } from '../../m.webfonts/mod.ts';

/**
 * Constants:
 */
const name = 'Prose.Manuscript';
const displayName = Pkg.toString(pkg, name, false);
export const D = {
  name,
  displayName,
  componentAttr: displayName,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
