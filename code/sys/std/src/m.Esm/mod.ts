/**
 * Tools for working with systems and runtimes that support
 * the ESM (EcmaScript Module) standard.
 * @module
 */
import type { EsmLib } from './t.ts';

import { Modules } from './m.Modules.ts';
import { parse } from './u.parse.ts';
import { toString } from './u.toString.ts';

/**
 * Tools for working with systems and runtimes that support
 * the ESM (EcmaScript Module) standard.
 */
export const Esm: EsmLib = {
  Modules,
  modules: Modules.create,
  parse,
  toString,
};
