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

/** The success version of an HTTP `FetchResponse`. */
export type FetchResponseOK<T> = {
  ok: true;
  status: t.HttpStatusCode;
  url: t.StringUrl;
  data: T;
  error: undefined;
};

/** The failure version of an HTTP `FetchResponse`. */
export type FetchResponseFail = {
  ok: false;
  status: t.HttpStatusCode;
  url: t.StringUrl;
  data: undefined;
  error: t.HttpError;
};

/**
 * A standard-error extend to include HTTP details.
 */
export type HttpError = t.StdError & {
  readonly status: t.HttpStatusCode;
  readonly statusText: string;
  readonly headers: t.HttpHeaders;
};
