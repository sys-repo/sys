import { pkg, Pkg } from '../common.ts';

export * from '../common.ts';

/**
 * Contants
 */
const name = 'Media.Timecode.Driver';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
} as const;
export const DEFAULTS = D;
