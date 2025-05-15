import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';
export { Slider } from '../Slider/mod.ts';

/**
 * Constants:
 */
const name = 'Media.Filters';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
} as const;
export const D = DEFAULTS;
