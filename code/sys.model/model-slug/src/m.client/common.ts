export * from '../common.ts';

export { SlugSchema } from '../m.schema/mod.ts';
export { SlugUrl } from '../m.client.url/mod.ts';

/**
 * Constant (Defaults).
 */
export const D = {
  CACHE_INIT: { cache: 'no-cache' } satisfies RequestInit,
} as const;
export const DEFAULTS = D;
