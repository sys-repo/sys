import type { t } from './common.ts';
import { GlobIgnore as Ignore } from './m.GlobIgnore.ts';
import { create } from './u.create.ts';
import { ls } from './u.ls.ts';

/**
 * Helpers for performing glob searches over a file-system.
 */
export const Glob: t.GlobLib = {
  create,
  ls,

  Ignore,
  ignore: Ignore.create,
};
