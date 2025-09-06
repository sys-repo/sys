import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';
export { useRedrawEffect } from '../use/mod.ts';

/**
 * Constants:
 */
const name = 'BinaryFile';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  path: ['files'],
} as const;
export const D = DEFAULTS;
