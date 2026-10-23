import type { t } from '../common.ts';

export * from '../common.ts';
export { Err } from '../m.Err/mod.ts';

/**
 * Defaults:
 */
export const DEFAULTS = {
  parse: {
    maxAttributes: 512,
    maxDepth: 256,
  } satisfies t.Xml.ParseOptions,
} as const;
export const D = DEFAULTS;
