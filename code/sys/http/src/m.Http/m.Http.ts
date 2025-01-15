import { type t, Url } from './common.ts';

import { HttpClient as Client } from '../m.Client/mod.ts';
import { Fetch } from '../m.Fetch/mod.ts';
import { toError, toHeaders, toResponse } from './u.ts';

/**
 * Http fetch helper.
 */
export const Http: t.HttpLib = {
  Fetch,
  Client,
  Url,

  client: Client.create,
  url: Url.create,

  toHeaders,
  toResponse,
  toError,
} as const;
