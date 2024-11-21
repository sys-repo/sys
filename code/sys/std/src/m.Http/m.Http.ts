import { HttpClient as Client } from '../m.Http.Client/mod.ts';
import { Fetch } from '../m.Http.Fetch/mod.ts';
import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { HttpUrl as Url } from './m.Url.ts';
import { toError, toHeaders, toResponse, toError2 } from './u.ts';

/**
 * Http fetch helper.
 */
export const Http: t.HttpLib = {
  Fetch,
  Client,
  Is,
  Url,

  client: Client.create,
  url: Url.create,

  toHeaders,
  toResponse,
  toError,
  toError2,
} as const;
