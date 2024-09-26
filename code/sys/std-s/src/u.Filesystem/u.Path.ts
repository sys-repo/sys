import { ensureDir, exists } from '@std/fs';
import { Path as Base } from '@sys/std';

/**
 * Path helpers.
 */
export const Path = {
  ...Base,
  exists,
  ensureDir,
} as const;
