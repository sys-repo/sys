import { HttpClient as Client } from '../m.Http.Client/mod.ts';
import { Fetch } from '../m.Http.Fetch/mod.ts';
import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { HttpUrl as Url } from './m.Url.ts';
import { toError, toHeaders, toResponse } from './u.ts';

/**
 * Http fetch helper.
 */
export const Http: t.HttpLib = {
  Fetch,
  Client,
  Is,
  Url,

  url: Url.create,
  client: Client.create,

  toHeaders,
  toResponse,
  toError,
} as const;
