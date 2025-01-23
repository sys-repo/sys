import type { t } from './common.ts';

/**
 * HTTP Status code.
 * https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
 */
export type HttpStatusCode = number;

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
