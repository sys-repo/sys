import type { t } from './common.ts';
import { Client } from './u.Http.Client.ts';
import { HttpUrl as Url } from './u.Http.Url.ts';
import { Is } from './u.Is.ts';
import { toError, toHeaders, toResponse } from './u.ts';

/**
 * Http fetch helper.
 */
export const Http: t.HttpLib = {
  Is,
  Url,
  url: Url.create,
  client: Client.create,

  toHeaders,
  toResponse,
  toError,
} as const;
