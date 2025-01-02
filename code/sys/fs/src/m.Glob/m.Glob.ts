import { type t, Ignore } from './common.ts';
import { create } from './u.create.ts';
import { ls } from './u.ls.ts';

/**
 * Helpers for performing glob searches over a file-system.
 */
export const Glob: t.GlobLib = {
  create,
  ls,
  ignore: Ignore.create,
};
