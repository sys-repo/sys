import type { t } from './common.ts';

import { File } from '../m.File/mod.ts';
import { Log } from '../m.Log/mod.ts';
import { create } from './u.create.ts';
export { create, File, Log };

/**
 * Library for copying template files.
 */
export const Tmpl: t.TmplLib = {
  Log,
  File,
  create,
};
