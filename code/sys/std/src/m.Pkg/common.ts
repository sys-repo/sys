import type { t } from '../common.ts';

export * from '../common.ts';
export { isObject } from '../m.Value/mod.ts';

/**
 * Defaults
 */
export const DEFAULTS = {
  get UNKNOWN(): t.Pkg {
    return { name: '<unknown>', version: '0.0.0' };
  },
} as const;
