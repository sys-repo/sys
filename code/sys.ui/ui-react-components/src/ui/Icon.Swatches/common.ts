import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

export { Icon } from '../Icon/mod.ts';
export { Slider } from '../Slider/mod.ts';

/**
 * Constants:
 */
const name = 'Icon.Swatches';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  minSize: 16,
  maxSize: 320,
  percent: 0.5,
} as const;
export const DEFAULTS = D;
