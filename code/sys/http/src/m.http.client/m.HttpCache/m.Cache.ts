import { type t } from './common.ts';
import { pkg } from './m.Cache.pkg.ts';

/**
 * Tools for working with the browser's HTTP cache within a "service-worker" process.
 */
export const Cache: t.HttpCacheLib = { pkg };
