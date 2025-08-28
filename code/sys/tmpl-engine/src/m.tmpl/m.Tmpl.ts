import type { TmplLib } from './t.ts';

import { File } from '../m.file/mod.ts';
import { Log } from '../m.log/mod.ts';
import { create } from './u.create.ts';
export { create, File, Log };

/**
 * Library for copying template files.
 */
export const Tmpl: TmplLib = {
  Log,
  File,
  create,
};
