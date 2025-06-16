import type { GlobLib } from './t.ts';

import { create } from './u.create.ts';
import { ls } from './u.ls.ts';

/**
 * Helpers for performing glob searches over a file-system.
 */
export const Glob: GlobLib = {
  create,
  ls,
};
