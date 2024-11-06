import type { t } from '../common.ts';

export * from '../common.ts';
export { Err } from '../m.Err/mod.ts';
export { Path } from '../m.Path/mod.ts';
export { rx } from '../m.Rx/mod.ts';
export { isObject } from '../m.Value/mod.ts';

/**
 * Defaults
 */
export const DEFAULTS = {
  get UNKNOWN(): t.Pkg {
    return { name: '<unknown>', version: '0.0.0' };
  },
} as const;
