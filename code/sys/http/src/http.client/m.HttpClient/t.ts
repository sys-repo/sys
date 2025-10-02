import type { t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * HTTP tools.
 */
export type HttpClientLib = {
  /** Tools for working with the `fetch` function in system/standard ways. */
  readonly Fetch: t.HttpFetchLib;
  /** Factory function that makes a new fetch client. */
  readonly fetcher: t.HttpFetchLib['make'];

  /** Tools for working with the browser's HTTP cache within a "service-worker" process. */
  readonly Cache: t.HttpCacheLib;

  /**
   * URL helpers for working with the HTTP lib.
   */
  readonly Url: t.UrlLib;
  /** Generator function for a new URL. */
  readonly url: t.UrlLib['parse'];

  /** Convert `Headers` into a simple headers object */
  toHeaders(input?: Headers | HeadersInit): t.HttpHeaders;

  /** Convert a `Response` into an HTTP client error. */
  toError(input: Response): t.HttpError | undefined;

  /** Convert a `Response` into a standard HTTP fetch response. */
  toResponse<T extends O>(input: Response): Promise<t.FetchResponse<T>>;

  /** Convert the `Blob` response to a `Uint8Array`. */
  toUint8Array(input?: Blob): Promise<Uint8Array>;

  /**
   * Poll an HTTP endpoint until it responds per the readiness predicate.
   * Throws on timeout. On success, resolves with simple timing metadata.
   */
  waitFor(url: string, opts?: t.HttpWaitOptions): Promise<t.HttpWaitResult>;

  /**
   * Convenience: boolean probe with default options.
   * Returns true if reachable within the timeout, false otherwise.
   */
  alive(url: string, opts?: Omit<HttpWaitOptions, 'predicate'>): Promise<boolean>;
};

/** Options for the `Http.waitFor` method. */
export type HttpWaitOptions = {
  /** Total time budget before throwing (default: 30_000). */
  readonly timeout?: t.Msecs;
  /** Delay between polls (default: 150). */
  readonly interval?: t.Msecs;
  /** Per-request timeout; if omitted, uses Math.max(2000, (interval ?? 150) * 2). */
  readonly requestTimeout?: t.Msecs;
  /** HTTP method for the probe (default: 'HEAD', falls back to 'GET' if HEAD fails). */
  readonly method?: 'HEAD' | 'GET';
  /** Extra headers to send with the probe. */
  readonly headers?: Readonly<Record<string, string>>;
  /** Fetch redirect behavior (default: 'manual'). */
  readonly redirect?: RequestRedirect;
  /**
   * Decide if the server is "ready".
   * Default: ok (2xx) OR 3xx OR 404 (route not found yet, but server is serving).
   */
  readonly predicate?: (res: Response) => boolean;
};

/** Result from the `Http.waitFor` method. */
export type HttpWaitResult = {
  readonly url: string;
  readonly attempts: number;
  readonly elapsed: t.Msecs;
  /** The last HTTP status seen (if any). */
  readonly lastStatus?: t.HttpStatusCode;
};
