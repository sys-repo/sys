import type { HttpLib } from './t.ts';

import { Fetch } from '../m.Http.Fetch/mod.ts';
import { Url } from './common.ts';
import { toError, toHeaders, toResponse, toUint8Array } from './u.ts';

/**
 * Http fetch helper.
 */
export const Http: HttpLib = {
  Fetch,
  Url,

  fetch: Fetch.create,
  url: Url.create,

  toHeaders,
  toResponse,
  toError,
  toUint8Array,
} as const;
