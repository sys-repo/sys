import type { t } from './common.ts';

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
export type FetchResponse<T> = {
  ok: boolean;
  status: number;
  url: t.StringUrl;
  data?: T;
  error?: t.StdError;
};

/**
 * A standard-error extend to include HTTP details.
 */
export type HttpError = t.StdError & {
  readonly status: number;
  readonly statusText: string;
  readonly headers: t.HttpHeaders;
};
