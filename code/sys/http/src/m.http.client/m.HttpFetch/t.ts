import type { t } from './common.ts';
export type * from './t.Headers.ts';

type RequestInput = RequestInfo | URL;

/**
 * Tools for working with the `fetch` function in system/standard ways.
 */
export type HttpFetchLib = {
  /** Fetch helper that can cancel fetch operations mid-stream. */
  make(args?: HttpFetchCreateOptions | t.UntilInput): t.HttpFetch;

  /** Probe header information to retrieve the byte-size of an HTTP resource. */
  byteSize(url: t.StringUrl, fetch: t.HttpFetch): Promise<ByteSizeResult>;
  byteSize(url: t.StringUrl, until?: t.UntilInput): Promise<ByteSizeResult>;
};

/** Options passed to the `HttpFetch.create` method. */
export type HttpFetchCreateOptions = {
  headers?: t.HttpMutateHeaders;
  accessToken?: t.StringJwt | (() => t.StringJwt);
  dispose$?: t.UntilObservable;
};

/**
 * A `fetch` helper that implements the `disposable` pattern using
 * an AbortController and signals to cancel fetch operations mid-stream.
 */
export type HttpFetch = t.Lifecycle & {
  /** HTTP headers map. */
  readonly headers: t.HttpHeaders;

  /** Retrieve the value for the specified header. */
  header(name: t.StringHttpHeaderName): t.StringHttpHeader | undefined;

  /** Invoke a fetch with the HTTP verb "HEAD" (no response body expected). */
  head(
    input: RequestInput,
    init?: RequestInit,
    options?: t.HttpFetchOptions,
  ): Promise<t.FetchResponse<undefined>>;

  /** Invoke a fetch with the HTTP verb "GET" to retrieve "application/json". */
  json<T>(
    input: RequestInput,
    init?: RequestInit,
    options?: t.HttpFetchOptions,
  ): Promise<t.FetchResponse<T>>;

  /** Invoke a fetch with the HTTP verb "GET" to retrieve "text/plain". */
  text(
    input: RequestInput,
    init?: RequestInit,
    options?: t.HttpFetchOptions,
  ): Promise<t.FetchResponse<string>>;

  /** Invoke a fetch with the HTTP verb "GET" to retrieve "application/octet-stream" binary file data. */
  blob(
    input: RequestInput,
    init?: RequestInit,
    options?: t.HttpFetchOptions,
  ): Promise<t.FetchResponse<Blob>>;
};

/** Options passed to the `fetch.text` method. */
export type HttpFetchOptions = { checksum?: t.StringHash };

/**
 * Response from `Fetch.byteSize` method.
 */
export type ByteSizeResult = Readonly<{
  url: string;
  bytes?: t.NumberBytes;
  from: 'head' | 'range' | 'unknown';
}>;
