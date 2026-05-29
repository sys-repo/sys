import { type t } from './common.ts';
import { DirHash as Hash } from '../m.Dir.Hash/mod.ts';

/**
 * Helpers for working with file-system directories.
 */
export const Dir: t.Dir.Lib = {
  /** Tools for working hashes of a file-system directory. */
  Hash,
};
