import type { t } from './common.ts';

/**
 * An HTTP status code (100-599).
 * Narrowed to an integer in the valid range.
 */
export type HttpStatusCode = number;

/**
 * HTTP header verbs.
 */
export type HttpMethod = 'HEAD' | 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH' | 'OPTIONS';

/** Input accepted by the Web Fetch API. */
export type FetchInput = RequestInfo | URL;

/** Web Fetch API compatible function. */
export type Fetch = (input: FetchInput, init?: RequestInit) => Promise<Response>;

/**
 * An object map of HTTP headers.
 */
export type HttpHeaders = {
  readonly [key: t.StringHttpHeaderName]: t.StringHttpHeader;
};
