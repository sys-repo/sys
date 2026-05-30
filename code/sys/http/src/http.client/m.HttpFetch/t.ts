import type { t } from './common.ts';
export type * from './t.Headers.ts';

type RequestInput = RequestInfo | URL;

/**
 * HTTP fetch helper contracts.
 */
export declare namespace HttpFetch {
  /** Fetch helper library. */
  export type Lib = {
    /** Fetch helper that can cancel fetch operations mid-stream. */
    make(args?: CreateOptions | t.UntilInput): Instance;

    /** Probe header information to retrieve the byte-size of an HTTP resource. */
    readonly byteSize: ByteSize.Method;
  };

  /** Fetch client handle. */
  export type Instance = t.Lifecycle & {
    /** HTTP headers map. */
    readonly headers: t.HttpHeaders;

    /** Retrieve the value for the specified header. */
    header(name: t.StringHttpHeaderName): t.StringHttpHeader | undefined;

    /** Invoke a fetch with the HTTP verb "HEAD" (no response body expected). */
    head(
      input: RequestInput,
      init?: RequestInit,
      options?: Options,
    ): Promise<t.FetchResponse<undefined>>;

    /** Invoke a fetch with the HTTP verb "GET" to retrieve "application/json". */
    json<T>(
      input: RequestInput,
      init?: RequestInit,
      options?: Options,
    ): Promise<t.FetchResponse<T>>;

    /** Invoke a fetch with the HTTP verb "GET" to retrieve "text/plain". */
    text(
      input: RequestInput,
      init?: RequestInit,
      options?: Options,
    ): Promise<t.FetchResponse<string>>;

    /** Invoke a fetch with the HTTP verb "GET" to retrieve "application/octet-stream" binary file data. */
    blob(
      input: RequestInput,
      init?: RequestInit,
      options?: Options,
    ): Promise<t.FetchResponse<Blob>>;
  };

  /** Options passed to `Fetch.make`. */
  export type CreateOptions = {
    headers?: t.HttpMutateHeaders;
    accessToken?: t.StringJwt | (() => t.StringJwt);
    until?: t.UntilInput;
    /**
     * Controls when the default `content-type` header is set.
     * - 'corsSafe' (default) sets it only for non-GET/HEAD requests that include a body.
     * - 'always' sets it whenever a content type is available and the user didn't supply one.
     */
    contentTypePolicy?: 'corsSafe' | 'always';
  };

  /** Options passed to fetch request helpers. */
  export type Options = { checksum?: t.StringHash };

  /**
   * HTTP byte-size probing contracts.
   */
  export namespace ByteSize {
    /** Probe header information to retrieve the byte-size of an HTTP resource. */
    export type Method = {
      (url: t.StringUrl, fetch: Instance): Promise<Result>;
      (url: t.StringUrl, until?: t.UntilInput): Promise<Result>;
    };

    /** Response from `Fetch.byteSize`. */
    export type Result = Readonly<{
      url: string;
      bytes?: t.NumberBytes;
      from: 'head' | 'range' | 'unknown';
    }>;
  }
}
