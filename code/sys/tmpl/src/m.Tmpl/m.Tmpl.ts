import type { t } from './common.ts';

import { Log } from '../m.Log/mod.ts';
import { create } from './u.create.ts';
export { create, Log };

/**
 * Library for copying template files.
 */
export const Tmpl: t.TmplLib = {
  Log,
  create,
};
