import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

export { Icon } from '../Icon/mod.ts';
export { Slider } from '../Slider/mod.ts';

/**
 * Constants:
 */
const name = 'Icon.Swatches';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const DEFAULTS = D;
