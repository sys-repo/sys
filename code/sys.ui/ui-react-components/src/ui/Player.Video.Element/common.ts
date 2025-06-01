import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Media.Video.Element';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  aspectRatio: '16/9',
  cornerRadius: 0,
} as const;
export const D = DEFAULTS;
