import type { t } from './common.ts';

/**
 * HTTP fetch helper contracts.
 */
export declare namespace HttpFetch {
  /** Fetch helper library. */
  export type Lib = {
    /** Create one bounded Fetch capability. */
    make(options: CreateOptions): Instance;

    /** Snapshot canonical default Fetch headers. */
    readonly defaultHeaders: DefaultHeaders.Method;

    /** Probe header information to retrieve the byte-size of an HTTP resource. */
    readonly byteSize: ByteSize.Method;
  };

  /** Fetch client handle. */
  export type Instance = t.Lifecycle & {
    /** HTTP headers map. */
    readonly headers: t.HttpHeaders;

    /** Retrieve the value for the specified header. */
    header(name: t.StringHttpHeaderName): t.StringHttpHeader | undefined;

    /** Invoke a bounded fetch with the HTTP verb "HEAD". */
    head(input: t.FetchInput, init?: Init): Promise<Response<undefined>>;

    /** Invoke a bounded fetch with the HTTP verb "GET" for JSON data. */
    json<T>(input: t.FetchInput, init?: Init, options?: Options): Promise<Response<T>>;

    /** Invoke a bounded fetch with the HTTP verb "GET" for text data. */
    text(input: t.FetchInput, init?: Init, options?: Options): Promise<Response<string>>;

    /** Invoke a bounded fetch with the HTTP verb "GET" for binary data. */
    blob(input: t.FetchInput, init?: Init, options?: Options): Promise<Response<Blob>>;
  };

  type OwnedInitKey =
    | 'body'
    | 'credentials'
    | 'method'
    | 'redirect'
    | 'referrer'
    | 'referrerPolicy';

  /** Request initialization excluding authority owned by bounded Fetch helpers. */
  export type Init = Omit<RequestInit, OwnedInitKey> & {
    readonly body?: never;
    readonly credentials?: never;
    readonly method?: never;
    readonly redirect?: never;
    readonly referrer?: never;
    readonly referrerPolicy?: never;
  };

  /** Response from an HTTP fetch request. */
  export type Response<T> = ResponseSuccess<T> | ResponseFailure;

  type ResponseCommon = {
    readonly status: t.HttpStatusCode;
    readonly statusText: string;
    readonly headers: Headers;
    readonly checksum?: ResponseChecksum;
  };

  /** Successful HTTP fetch response. */
  export type ResponseSuccess<T> = ResponseCommon & ResponsePolicy.SourceEvidence & {
    readonly ok: true;
    readonly data: T;
    readonly error: undefined;
  };

  /** Failed HTTP fetch response. */
  export type ResponseFailure = ResponseCommon & {
    readonly ok: false;
    /** Sanitized requested URL retained for diagnostics. */
    readonly url: t.StringUrl;
    readonly data: undefined;
    readonly error: HttpFetch.Error;
  };

  /** Checksum evidence for fetched response data. */
  export type ResponseChecksum = {
    readonly valid: boolean;
    readonly expected: t.StringHash;
    readonly actual: t.StringHash;
  };

  /** Standard error extended with HTTP details. */
  export type Error = t.StdError & {
    readonly status: t.HttpStatusCode;
    readonly statusText: string;
    readonly headers: t.HttpHeaders;
    /** Stable diagnostic code for an owner-authenticated policy failure. */
    readonly policyFailure?: ResponsePolicy.FailureKind;
  };

  /** Options passed to `Fetch.make`. */
  export type CreateOptions = {
    /** Finite response and source-authority policy snapshotted by the client. */
    readonly policy: ResponsePolicy;
    /** Mutate default headers used by created request helpers. */
    readonly headers?: Mutate.Headers;
    /** Access token or token factory normalized into an Authorization header. */
    readonly accessToken?: t.StringJwt | (() => t.StringJwt);
    /** Lifecycle boundary that aborts in-flight requests. */
    readonly until?: t.UntilInput;
    /**
     * Controls when the default `content-type` header is set.
     * - 'corsSafe' (default) sets it only for requests that include a body.
     * - 'always' sets it whenever a content type is available and the caller omitted one.
     */
    readonly contentTypePolicy?: 'corsSafe' | 'always';
  };

  /**
   * Default header snapshot contracts.
   */
  export namespace DefaultHeaders {
    /** Canonical default-header construction authority. */
    export type Options = Readonly<Pick<CreateOptions, 'accessToken' | 'headers'>>;

    /** Snapshot canonical default Fetch headers. */
    export type Method = (options: Options) => Headers;
  }

  /** Options passed to body-bearing Fetch helpers. */
  export type Options = {
    /** Optional expected checksum for validating successful response data. */
    readonly checksum?: t.StringHash;
    /** Receive bounded body-transfer progress. */
    readonly onProgress?: ResponsePolicy.ProgressHandler;
  };

  /** Finite response and source-authority policy. */
  export type ResponsePolicy = {
    /** Maximum successful response-body bytes retained. */
    readonly maxBytes: t.NumberBytes;
    /** Maximum milliseconds for one complete Fetch operation. */
    readonly timeout: t.Msecs;
    /** Maximum redirect hops followed. */
    readonly maxRedirects: number;
    /** Minimum milliseconds between non-terminal progress events. */
    readonly progressInterval: t.Msecs;
    /** Exact HTTP(S) origins admitted for requests. */
    readonly sourceOrigins: readonly t.StringUrl[];
    /** Admitted source origins authorized to receive caller/default headers. */
    readonly credentialOrigins: readonly t.StringUrl[];
  };

  /**
   * Bounded response-policy contracts.
   */
  export namespace ResponsePolicy {
    /** Requested and terminal source evidence from a successful policy-bound request. */
    export type SourceEvidence = {
      readonly requestedUrl: t.StringUrl;
      readonly finalUrl: t.StringUrl;
    };

    /** Synchronous body-transfer progress callback. */
    export type ProgressHandler = (event: ProgressEvent) => void;

    /** Body-transfer progress from a policy-bound response. */
    export type ProgressEvent = SourceEvidence & {
      readonly loaded: t.NumberBytes;
      readonly total?: t.NumberBytes;
      readonly complete: boolean;
    };

    /** Stable diagnostic code for a bounded Fetch policy failure. */
    export type FailureKind =
      | 'invalid-policy'
      | 'invalid-request'
      | 'invalid-url'
      | 'source-denied'
      | 'redirect-invalid'
      | 'redirect-downgrade'
      | 'redirect-loop'
      | 'redirect-limit'
      | 'response-timeout'
      | 'response-too-large'
      | 'progress-failure';
  }

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
