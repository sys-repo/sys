import { Path, type t } from './common.ts';

/**
 * Filesystem/Path type verification flags.
 */
export const Is: t.FsIs = {
  ...Path.Is,
} as const;
