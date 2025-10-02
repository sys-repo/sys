import { Cache } from '../m.HttpCache/mod.ts';
import { Fetch } from '../m.HttpFetch/mod.ts';

import { type t, Url } from './common.ts';
import { toError, toHeaders, toResponse, toUint8Array } from './u.ts';
import { alive, waitFor } from './u.wait.ts';

/**
 * Http fetch helper.
 */
export const HttpClient: t.HttpClientLib = {
  Fetch,
  Cache,
  Url,

  fetcher: Fetch.make,
  url: Url.parse,

  toHeaders,
  toResponse,
  toError,
  toUint8Array,

  waitFor,
  alive,
};

/** Alias to the `HttpClient` */
export const Http = HttpClient;
