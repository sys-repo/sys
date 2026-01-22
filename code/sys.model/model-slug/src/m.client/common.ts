export * from '../common.ts';

export { SlugSchema } from '../m.schema/mod.ts';

export const D = {
  CACHE_INIT: { cache: 'no-cache' } satisfies RequestInit,
} as const;
