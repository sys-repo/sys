/**
 * @module
 * Core ESM import and dependency helpers.
 */
import type { t } from './common.ts';

import { Policy } from './m.Policy/mod.ts';
import { Modules } from './m.Modules.ts';
import { hasDefaultExport } from './m.hasDefaultExport.ts';
import { parse } from './u.parse.ts';
import { toString } from './u.toString.ts';

/**
 * Core ESM import and dependency helpers.
 */
export const Esm: t.EsmLib = {
  Policy,
  Modules,
  modules: Modules.create,
  parse,
  toString,
  hasDefaultExport,
};
