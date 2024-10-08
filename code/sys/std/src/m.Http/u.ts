import type { t } from './common.ts';

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
 * Convert a web [Response] into the standard client {error} object.
 */
export function toError(res: Response): t.HttpClientError {
  const { ok, status, statusText } = res;
  const headers = toHeaders(res.headers);
  return { ok, status, statusText, headers };
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
