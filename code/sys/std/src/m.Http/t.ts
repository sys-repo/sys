import type { t } from '../common/mod.ts';

type O = Record<string, unknown>;

/**
 * @external
 */

/** HTTP header verbs. */
export type HttpMethod = 'HEAD' | 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH' | 'OPTIONS';

/** An object map of HTTP headers. */
export type HttpHeaders = { readonly [key: t.StringHttpHeaderName]: t.StringHttpHeader };

/**
 * @module
 */

/**
 * HTTP tools.
 */
export type HttpLib = {
  /** Tools for working with the `fetch` function in system/standard ways. */
  readonly Fetch: t.HttpFetchLib;

  /** Type guards (boolean evaluators). */
  readonly Is: t.HttpIs;

  /** URL helpers for working with the HTTP lib. */
  readonly Url: t.HttpUrlLib;

  /** Generator function for a new URL. */
  readonly url: t.HttpUrlLib['create'];

  /** Generator function for a new HTTP fetch client. */
  readonly client: t.HttpClientLib['create'];

  /** Convert `Headers` into a simple headers object */
  toHeaders(input: Headers): t.HttpHeaders;

  /** Convert a `Response` into an HTTP client error. */
  toError(res: Response): t.HttpClientError;

  /** Convert a `Response` into a standard `HttpClientResponse` */
  toResponse<T extends O>(res: Response): Promise<t.HttpClientResponse<T>>;
};

/**
 * URL helpers for working with the HTTP lib.
 */
export type HttpUrlLib = {
  /** Generator function for a new URL helpers instance. */
  create(base: t.StringUrl | Deno.NetAddr): t.HttpUrl;

  /** Create URL helpers from a `NetAddr` */
  fromAddr(base: Deno.NetAddr): t.HttpUrl;

  /** Create URL helpers from string. */
  fromUrl(base: t.StringUrl): t.HttpUrl;
};

/**
 * HTTP client tools (fetch).
 */
export type HttpClientLib = {
  /** Generator function for a new HTTP fetch client. */
  create(options?: t.HttpFetchClientOptions): t.HttpFetchClient;
};

/**
 * Type guards (boolean evaluators).
 */
export type HttpIs = {
  /** Determine if the given value is a `NetAddr`. */
  netaddr(input: unknown): input is Deno.NetAddr;
};

/**
 * Represents a URL endpoint of an HTTP service.
 */
export type HttpUrl = {
  /** The base URL path. */
  readonly base: string;

  /** Join parts of a URL path. */
  join(...parts: string[]): string;

  /** Collapse the URL to a simple HREF string. */
  toString(): string;
};

/**
 * An HTTP fetch client instance.
 */
export type HttpFetchClient = {
  /** The MIME type. */
  readonly contentType: t.StringContentType;

  /** HTTP headers map. */
  readonly headers: t.HttpHeaders;

  /** Retrrieve the value for the specified header. */
  header(name: t.StringHttpHeaderName): t.StringHttpHeader | undefined;

  /** Fetch request. */
  fetch(url: t.StringUrl, options?: RequestInit): Promise<Response>;

  /** Invoke a fetch request with the specified HTTP method (verb). */
  method(method: t.HttpMethod, url: t.StringUrl, options?: RequestInit): Promise<Response>;

  /** HTTP:GET request. */
  get(url: t.StringUrl, options?: RequestInit): Promise<Response>;

  /** HTTP:HEAD request. */
  head(url: t.StringUrl, options?: RequestInit): Promise<Response>;

  /** HTTP:OPTIONS request */
  options(url: t.StringUrl, options?: RequestInit): Promise<Response>;

  /** HTTP:PUT request */
  put(url: t.StringUrl, body: O, options?: RequestInit): Promise<Response>;

  /** HTTP:POST request. */
  post(url: t.StringUrl, body: O, options?: RequestInit): Promise<Response>;

  /** HTTP:PATCH request. */
  patch(url: t.StringUrl, body: O, options?: RequestInit): Promise<Response>;

  /** HTTP:DELETE request. */
  delete(url: t.StringUrl, options?: RequestInit): Promise<Response>;
};

/**
 * HTTP fetch options.
 */
export type HttpFetchClientOptions = {
  accessToken?: t.StringJwt | (() => t.StringJwt);
  contentType?: t.StringContentType | (() => t.StringContentType);
  headers?: t.HttpFetchClientMutateHeaders;
};

/**
 * Handler that safely "mutates" client headers within a fetch client.
 */
export type HttpFetchClientMutateHeaders = (e: HttpFetchClientMutateHeadersArgs) => void;

/**
 * Argyments for the Header mutation handler.
 */
export type HttpFetchClientMutateHeadersArgs = {
  /** HTTP headers. */
  readonly headers: t.HttpHeaders;

  /** Retrieve the header with the specifid name. */
  get(name: string): t.StringHttpHeader;

  /** Mutate: set a new header value. */
  set(name: string, value: string | number | null): HttpFetchClientMutateHeadersArgs;
};

/**
 * Client Response
 */
export type HttpClientResponse<T extends O> = HttpClientResponseOK<T> | HttpClientResponseErr;

/**
 * A fetch client response that was successful (200).
 */
export type HttpClientResponseOK<T extends O> = {
  readonly ok: true;
  readonly data: T;
  readonly error?: undefined;
};

/**
 * A fetch client response that has error'd.
 */
export type HttpClientResponseErr = {
  readonly ok: false;
  readonly data?: undefined;
  readonly error: t.HttpClientError;
};

/**
 * HTTP Error
 */
export type HttpClientError = {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly headers: t.HttpHeaders;
};
