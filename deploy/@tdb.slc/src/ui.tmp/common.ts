import { type t, pkg, Pkg } from '../ui/common.ts';
export * from '../ui/common.ts';

/**
 * Constants:
 */
const name = 'MyMandelbrot';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  running: true,
  canvasWidth: 500,
  canvasHeight: 500,
  canvasMaxIter: 200,
} as const;
export const D = DEFAULTS;
