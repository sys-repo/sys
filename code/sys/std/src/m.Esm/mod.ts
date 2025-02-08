/**
 * @module
 * Tools for working with systems and runtimes that support
 * the ESM (EcmaScript Module) standard.
 */
import type { t } from './common.ts';
import { parse } from './u.parse.ts';
import { toString } from './u.toString.ts';
import { Modules } from './m.Modules.ts';

export const Esm: t.EsmLib = {
  Modules,
  modules: Modules.create,
  parse,
  toString,
};
