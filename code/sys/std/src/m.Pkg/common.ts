import type { t } from '../common.ts';

export * from '../common.ts';
export { Err } from '../m.Err/mod.ts';
export { Is } from '../m.Is/mod.ts';
export { Path } from '../m.Path/mod.ts';
export { Rx } from '../m.Rx/mod.ts';
export { isHttpUrl, Url } from '../m.Url/mod.ts';

/**
 * Constants
 */
export const DEFAULTS = {
  unknown(): t.Pkg {
    return { name: '<unknown>', version: '0.0.0' };
  },
} as const;
export const D = DEFAULTS;
