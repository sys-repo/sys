import { type t, Err, Is, isRecord } from './common.ts';

type O = Record<string, unknown>;

/**
 * Convert a [Header] object into a simple {key/value} object.
 */
export function toHeaders(input?: Headers | HeadersInit): t.HttpHeaders {
  const res: any = {};
  if (!input) return res;

  if (input instanceof Headers) {
    input.forEach((value, key) => (res[key] = String(value)));
    return res;
  }

  if (Array.isArray(input)) {
    input.forEach(([key, value]) => (res[key] = String(value)));
    return res;
  }

  return isRecord(input) ? input : res;
}

/**
 * Convert a web `Response` into the standard client HTTP error object.
 */
export function toError(res: Response): t.HttpError | undefined {
  const { status } = res;
  if (Is.statusOK(status)) return undefined;
  const statusText = String(res.statusText).trim();
  const headers = toHeaders(res.headers);
  const name = 'HttpError';
  const msg = `${status} ${statusText || 'HTTP Error'}`;
  return { ...Err.std(msg, { name }), status, statusText, headers };
}

/**
 * Convert a web [Response] into the standard client {Response} object.
 */
export async function toResponse<T extends O>(res: Response) {
  const { ok, status } = res;
  const error = toError(res);
  const data = ok ? ((await res.json()) as T) : undefined;
  const url = res.url;
  return { ok, status, url, data, error } as t.FetchResponse<T>;
}

/**
 * Convert the `Blob` response to a `Uint8Array`.
 */
export async function toUint8Array(input?: Blob) {
  return input ? new Uint8Array(await input.arrayBuffer()) : new Uint8Array();
}
