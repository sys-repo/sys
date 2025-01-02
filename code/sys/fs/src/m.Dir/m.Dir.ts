import { type t } from './common.ts';
import { snapshot } from './u.snapshot.ts';

/**
 * Helpers for working with file-system directories.
 */
export const Dir: t.FsDirLib = {
  /** Create a snapshot of the specified directory. */
  snapshot,
};
