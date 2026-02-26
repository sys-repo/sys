export { Fs } from '../m.Fs/mod.ts';
export { Path } from '../m.Path/mod.ts';
export { Pkg } from '@sys/std/pkg';

export * from '../common.ts';

/**
 * Constants
 */
export const DEFAULTS = {
  hashPolicy: { path: 'src/m.Pkg/m.Pkg.Dist.ts' },
} as const;
export const D = DEFAULTS;
