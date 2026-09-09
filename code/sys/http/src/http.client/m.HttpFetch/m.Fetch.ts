import type { t } from './common.ts';
import { byteSize } from './u/u.byteSize.ts';
import { defaultHeaders } from './u/u.headers.ts';
import { makeFetch as make } from './u/u.make.ts';

/**
 * Tools for working with the `fetch` function in system/standard ways.
 */
export const Fetch: t.HttpFetch.Lib = Object.freeze({
  make,
  defaultHeaders,
  byteSize,
});
