import { Cache } from '../m.HttpCache/mod.ts';
import { Fetch } from '../m.HttpFetch/mod.ts';
import { Preload } from '../m.HttpPreload/mod.ts';
import { ServiceWorker } from '../m.HttpServiceWorker/mod.ts';

import { type t, Url } from './common.ts';
import { toError, toHeaders, toJsonResponse, toUint8Array } from './u.ts';
import { isAlive, waitFor } from './u.wait.ts';

/**
 * Http fetch helper.
 */
export const HttpClient: t.HttpClient.Lib = Object.freeze({
  Url,
  Fetch,
  Preload,
  Cache,
  ServiceWorker,

  fetcher: Fetch.make,
  url: Url.parse,

  toHeaders,
  toJsonResponse,
  toError,
  toUint8Array,

  waitFor,
  isAlive,
});

/** Alias to the `HttpClient` */
export const Http = HttpClient;
