import type { t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * @module
 * HTTP tools.
 */
export type HttpLib = {
  /** Tools for working with the `fetch` function in system/standard ways. */
  readonly Fetch: t.HttpFetchLib;
  /** Generator function for a new fetch client. */
  readonly fetch: t.HttpFetchLib['disposable'];

  /** HTTP client tools (GET, PUT, POST, DELETE over Fetch). */
  readonly Client: t.HttpClientLib;
  /** Generator function for a new HTTP/fetch client. */
  readonly client: t.HttpClientLib['create'];

  /** URL helpers for working with the HTTP lib. */
  readonly Url: t.UrlLib;
  /** Generator function for a new URL. */
  readonly url: t.UrlLib['create'];

  /** Convert `Headers` into a simple headers object */
  toHeaders(input?: Headers | HeadersInit): t.HttpHeaders;

  /** Convert a `Response` into an HTTP client error. */
  toError(input: Response): t.HttpError | undefined;

  /** Convert a `Response` into a standard HTTP fetch response. */
  toResponse<T extends O>(input: Response): Promise<t.FetchResponse<T>>;
};
