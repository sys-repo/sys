import { Cache } from '../m.HttpCache/mod.ts';
import { Fetch } from '../m.HttpFetch/mod.ts';

import { type t, Url } from './common.ts';
import { toError, toHeaders, toResponse, toUint8Array } from './u.ts';

/**
 * Http fetch helper.
 */
export const Http: t.HttpClientLib = {
  Fetch,
  Cache,
  Url,

  fetch: Fetch.create,
  url: Url.parse,

  toHeaders,
  toResponse,
  toError,
  toUint8Array,
} as const;
