import type { t } from '../common.ts';
type O = Record<string, unknown>;

/**
 * HTTP tools.
 * @module
 */
export type HttpLib = {
  /**
   * Tools for working with the `fetch` function in system/standard ways.
   */
  readonly Fetch: t.HttpFetchLib;
  /** Generator function for a new fetch client. */
  readonly fetch: t.HttpFetchLib['create'];

  /**
   * Tools for working with the browser's HTTP cache within a "service-worker" process.
   */
  readonly Cache: t.HttpCacheLib;

  /**
   * URL helpers for working with the HTTP lib.
   */
  readonly Url: t.UrlLib;
  /** Generator function for a new URL. */
  readonly url: t.UrlLib['parse'];

  /**
   * Methods:
   */

  /** Convert `Headers` into a simple headers object */
  toHeaders(input?: Headers | HeadersInit): t.HttpHeaders;

  /** Convert a `Response` into an HTTP client error. */
  toError(input: Response): t.HttpError | undefined;

  /** Convert a `Response` into a standard HTTP fetch response. */
  toResponse<T extends O>(input: Response): Promise<t.FetchResponse<T>>;

  /** Convert the `Blob` response to a `Uint8Array`. */
  toUint8Array(input?: Blob): Promise<Uint8Array>;
};
