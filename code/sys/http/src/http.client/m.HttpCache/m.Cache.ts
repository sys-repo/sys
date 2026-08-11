import { CacheCmd as Cmd } from '../m.HttpCache.Cmd/mod.ts';
import { type t } from './common.ts';
import { PkgCache as Pkg } from './u.pkg.names.ts';
import { pkg } from './m.Cache.pkg.ts';

/**
 * Tools for working with the browser's HTTP cache within a "service-worker" process.
 */
export const Cache: t.HttpCache.Lib = {
  Cmd,
  Pkg,
  pkg,
};
