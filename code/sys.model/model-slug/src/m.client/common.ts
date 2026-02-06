export * from '../common.ts';

export { SlugSchema } from '../m.schema/mod.ts';

/**
 * Constant (Defaults).
 */
export const D = {
  CACHE_INIT: { cache: 'no-cache' } satisfies RequestInit,
  manifestsDir: '-manifests',
  contentLocation: 'content',
} as const;
export const DEFAULTS = D;
