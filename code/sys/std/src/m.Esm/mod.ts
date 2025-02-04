/**
 * @module
 * Tools for working with systems and runtimes that support
 * the ESM (EcmaScript Module) standard.
 */
import type { t } from './common.ts';
import { parse } from './u.parse.ts';

export const Esm: t.EsmLib = {
  parse,

  toString(module) {
    const { prefix, name = '<Unnamed>', version } = module;
    let res = name;
    if (prefix) res = `${prefix}:${res}`;
    if (version) res += `@${version}`;
    return res;
  },
};
