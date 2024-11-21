import { Fetch } from '../m.Http.Fetch/mod.ts';
import type { t } from './common.ts';
import { HttpClient as Client } from '../m.Http.Client/mod.ts';
import { HttpUrl as Url } from './u.Http.Url.ts';
import { Is } from './u.Is.ts';
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
