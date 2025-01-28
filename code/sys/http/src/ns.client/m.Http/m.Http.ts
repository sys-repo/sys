import { type t, Url } from './common.ts';

import { Fetch } from '../m.Http.Fetch/mod.ts';
import { toError, toHeaders, toResponse } from './u.ts';

/**
 * Http fetch helper.
 */
export const Http: t.HttpLib = {
  Fetch,
  Url,

  fetch: Fetch.create,
  url: Url.create,

  toHeaders,
  toResponse,
  toError,
} as const;
