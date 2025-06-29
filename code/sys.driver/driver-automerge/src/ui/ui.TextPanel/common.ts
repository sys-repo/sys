import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'TextPanel';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  label: 'Untitled',
} as const;
export const D = DEFAULTS;
