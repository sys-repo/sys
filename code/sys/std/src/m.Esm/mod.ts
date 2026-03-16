/**
 * @module
 * Tools for working with systems and runtimes that support
 * the ESM (EcmaScript Module) standard.
 */
import type { t } from './common.ts';

import { Modules } from './m.Modules.ts';
import { hasDefaultExport } from './m.hasDefaultExport.ts';
import { parse } from './u.parse.ts';
import { toString } from './u.toString.ts';

/**
 * Tools for working with systems and runtimes that support
 * the ESM (EcmaScript Module) standard.
 */
export const Esm: t.EsmLib = {
  Modules,
  modules: Modules.create,
  parse,
  toString,
  hasDefaultExport,
};
