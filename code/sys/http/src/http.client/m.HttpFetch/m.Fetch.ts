import type { t } from './common.ts';
import { makeFetch as make } from './m.Fetch.make.ts';
import { byteSize } from './u.byteSize.ts';

/**
 * Tools for working with the `fetch` function in system/standard ways.
 */
export const Fetch: t.HttpFetchLib = {
  make,
  byteSize,
};
