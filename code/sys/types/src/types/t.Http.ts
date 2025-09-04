import type { t } from './common.ts';

/**
 * An HTTP status code (100–599).
 * Narrowed to an integer in the valid range.
 */
// prettier-ignore
export type HttpStatusCode = 100 | 101 | 102 | 103
  | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
  | 300 | 301 | 302 | 303 | 304 | 305 | 307 | 308
  | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409
  | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421
  | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451
  | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;

/**
 * HTTP header verbs.
 */
export type HttpMethod = 'HEAD' | 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH' | 'OPTIONS';

/**
 * An object map of HTTP headers.
 */
export type HttpHeaders = {
  readonly [key: t.StringHttpHeaderName]: t.StringHttpHeader;
};

/**
 * Response from an HTTP fetch request.
 */
export type FetchResponse<T> = FetchResponseOK<T> | FetchResponseFail;

type FetchResponseCommon = {
  status: t.HttpStatusCode;
  statusText: string;
  url: t.StringUrl;
  headers: Headers;
  checksum?: t.FetchResponseChecksum;
};

/** The success version of an HTTP `FetchResponse`. */
export type FetchResponseOK<T> = FetchResponseCommon & { ok: true; data: T; error: undefined };

/** The failure version of an HTTP `FetchResponse`. */
export type FetchResponseFail = FetchResponseCommon & {
  ok: false;
  data: undefined;
  error: t.HttpError;
};

/** The chechsum (hash matching) match results for a HTTP response data. */
export type FetchResponseChecksum = {
  valid: boolean;
  expected: t.StringHash;
  actual: t.StringHash;
};

/**
 * A standard-error extend to include HTTP details.
 */
export type HttpError = t.StdError & {
  readonly status: t.HttpStatusCode;
  readonly statusText: string;
  readonly headers: t.HttpHeaders;
};
