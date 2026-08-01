import type { t } from './common.ts';

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
      input: t.FetchInput,
      init?: RequestInit,
      options?: Options,
    ): Promise<Response<undefined>>;

    /** Invoke a fetch with the HTTP verb "GET" to retrieve "application/json". */
    json<T>(
      input: t.FetchInput,
      init?: RequestInit,
      options?: Options,
    ): Promise<Response<T>>;

    /** Invoke a fetch with the HTTP verb "GET" to retrieve "text/plain". */
    text(
      input: t.FetchInput,
      init?: RequestInit,
      options?: Options,
    ): Promise<Response<string>>;

    /** Invoke a fetch with the HTTP verb "GET" to retrieve "application/octet-stream" binary file data. */
    blob(
      input: t.FetchInput,
      init?: RequestInit,
      options?: Options,
    ): Promise<Response<Blob>>;
  };

  /** Response from an HTTP fetch request. */
  export type Response<T> = ResponseSuccess<T> | ResponseFailure;

  type ResponseCommon = {
    status: t.HttpStatusCode;
    statusText: string;
    url: t.StringUrl;
    headers: Headers;
    checksum?: ResponseChecksum;
  };

  /** Successful HTTP fetch response. */
  export type ResponseSuccess<T> = ResponseCommon & {
    ok: true;
    data: T;
    error: undefined;
  };

  /** Failed HTTP fetch response. */
  export type ResponseFailure = ResponseCommon & {
    ok: false;
    data: undefined;
    error: HttpFetch.Error;
  };

  /** Checksum evidence for fetched response data. */
  export type ResponseChecksum = {
    valid: boolean;
    expected: t.StringHash;
    actual: t.StringHash;
  };

  /** Standard error extended with HTTP details. */
  export type Error = t.StdError & {
    readonly status: t.HttpStatusCode;
    readonly statusText: string;
    readonly headers: t.HttpHeaders;
  };

  /** Options passed to `Fetch.make`. */
  export type CreateOptions = {
    /** Mutate default headers used by created request helpers. */
    headers?: Mutate.Headers;
    /** Access token or token factory normalized into an Authorization header. */
    accessToken?: t.StringJwt | (() => t.StringJwt);
    /** Lifecycle boundary that aborts in-flight requests. */
    until?: t.UntilInput;
    /**
     * Controls when the default `content-type` header is set.
     * - 'corsSafe' (default) sets it only for non-GET/HEAD requests that include a body.
     * - 'always' sets it whenever a content type is available and the user didn't supply one.
     */
    contentTypePolicy?: 'corsSafe' | 'always';
  };

  /** Options passed to fetch request helpers. */
  export type Options = {
    /** Optional expected checksum for validating successful response data. */
    checksum?: t.StringHash;
  };

  /**
   * Fetch mutation contracts.
   */
  export namespace Mutate {
    /** Safely mutate headers within a fetch client. */
    export type Headers = (e: Headers.Args) => void;

    /**
     * Header mutation contracts.
     */
    export namespace Headers {
      /** Header mutation callback arguments. */
      export type Args = {
        /** Current HTTP headers. */
        readonly headers: t.HttpHeaders;
        /** Retrieve a header by name when present. */
        get(name: t.StringHttpHeaderName): t.StringHttpHeader | undefined;
        /** Set or remove a header value. */
        set(
          name: t.StringHttpHeaderName,
          value: t.StringHttpHeader | number | null,
        ): Args;
      };
    }
  }

  /**
   * HTTP byte-size probing contracts.
   */
  export namespace ByteSize {
    /** Probe header information to retrieve the byte-size of an HTTP resource. */
    export type Method = (url: t.StringUrl, until?: t.UntilInput) => Promise<Result>;

    /** Response from `Fetch.byteSize`. */
    export type Result = Readonly<{
      /** URL that was probed. */
      url: string;
      /** Byte size when discoverable from headers. */
      bytes?: t.NumberBytes;
      /** Indicates that probing ended because its lifecycle was cancelled. */
      cancelled?: true;
      /** Header strategy that produced the byte size. */
      from: 'head' | 'range' | 'unknown';
    }>;
  }
}
