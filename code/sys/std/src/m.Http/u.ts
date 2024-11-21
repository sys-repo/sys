import type { t } from './common.ts';
import { Err } from '../m.Err/mod.ts';

type O = Record<string, unknown>;

/**
 * Convert a [Header] object into a simple {key/value} object.
 */
export function toHeaders(input: Headers): t.HttpHeaders {
  const res: any = {};
  input.forEach((value, key) => (res[key] = String(value)));
  return res;
}

/**
 * Convert a web `Response` into the standard client HTTP error object.
 */
export function toError(res: Response): t.HttpClientError {
  const { ok, status, statusText } = res;
  const headers = toHeaders(res.headers);
  return { ok, status, statusText, headers };
}

/**
 * Convert a web `Response` into the standard client HTTP error object.
 */
export function toError2(res: Response): t.HttpError | undefined {
  const { status } = res;
  if (statusOK(status)) return undefined;

  const statusText = String(res.statusText).trim();
  const headers = toHeaders(res.headers);
  const msg = `${status} ${statusText || 'HTTP Error'}`;
  return { ...Err.std(msg), status, statusText, headers };
}

/**
 * Convert a web [Response] into the standard client {Response} object.
 */
export async function toResponse<T extends O>(res: Response) {
  const ok = res.ok;
  const error = ok ? undefined : toError(res);
  const data = ok ? ((await res.json()) as T) : undefined;
  return { ok, data, error } as t.HttpClientResponse<T>;
}

/**
 * Determine if the HTTP status code is within the 200 range.
 */
export const statusOK: t.HttpIs['statusOK'] = (input) => {
  if (typeof input !== 'number') return false;
  return String(input)[0] === '2';
};
