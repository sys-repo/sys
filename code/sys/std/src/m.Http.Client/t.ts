import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * @module
 * HTTP client tools (GET, PUT, POST, DELETE over Fetch).
 */
export type HttpClientLib = {
  /** Generator function for a new HTTP fetch client. */
  create(options?: t.HttpClientOptions): t.HttpClient;
};

/**
 * An HTTP fetch client instance.
 */
export type HttpClient = {
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
export type HttpClientOptions = {
  accessToken?: t.StringJwt | (() => t.StringJwt);
  contentType?: t.StringContentType | (() => t.StringContentType);
  headers?: t.HttpMutateHeaders;
};

/**
 * Handler that safely "mutates" client headers within a fetch client.
 */
export type HttpMutateHeaders = (e: HttpMutateHeadersArgs) => void;

/**
 * Argyments for the Header mutation handler.
 */
export type HttpMutateHeadersArgs = {
  /** HTTP headers. */
  readonly headers: t.HttpHeaders;

  /** Retrieve the header with the specifid name. */
  get(name: string): t.StringHttpHeader;

  /** Mutate: set a new header value. */
  set(name: string, value: string | number | null): HttpMutateHeadersArgs;
};
