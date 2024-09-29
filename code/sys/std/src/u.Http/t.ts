import type { t } from '../common/mod.ts';

type O = Record<string, unknown>;

/**
 * @external
 */

/**
 * map to: /sys.types
 */
export type HttpMethod = 'HEAD' | 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH' | 'OPTIONS';
export type HttpHeaders = { readonly [key: t.StringHttpHeaderName]: t.StringHttpHeader };

// 🐷 NB: Duplicated from:
// import type { HttpMethod } from '../../../../../sys/sys.net.http/src/types.ts';

/**
 * @module
 */

/**
 * HTTP tools.
 */
export type HttpLib = {
  readonly Is: t.HttpIs;
  readonly Url: t.HttpUrlLib;
  readonly url: t.HttpUrlLib['create'];
  readonly client: t.HttpClientLib['create'];

  toHeaders(input: Headers): t.HttpHeaders;

  toError(res: Response): t.HttpClientError;
  toResponse<T extends O>(res: Response): Promise<t.HttpClientResponse<T>>;
};

/**
 * URL helpers for working with the HTTP lib.
 */
export type HttpUrlLib = {
  create(base: t.StringUrl | Deno.NetAddr): t.HttpUrl;
  fromAddr(base: Deno.NetAddr): t.HttpUrl;
  fromUrl(base: t.StringUrl): t.HttpUrl;
};

/**
 * HTTP client tools (fetch).
 */
export type HttpClientLib = {
  create(options?: t.HttpFetchClientOptions): t.HttpFetchClient;
};

/**
 * Type guards (boolean evaluators).
 */
export type HttpIs = {
  netaddr(input: unknown): input is Deno.NetAddr;
};

/**
 * Represents a URL endpoint of an HTTP service.
 */
export type HttpUrl = {
  readonly base: string;
  join(...parts: string[]): string;
  toString(): string;
};

/**
 * An HTTP fetch client instance.
 */
export type HttpFetchClient = {
  readonly contentType: t.StringContentType;
  readonly headers: t.HttpHeaders;
  header(name: t.StringHttpHeaderName): t.StringHttpHeader | undefined;

  fetch(url: t.StringUrl, options?: RequestInit): Promise<Response>;
  method(method: t.HttpMethod, url: t.StringUrl, options?: RequestInit): Promise<Response>;

  get(url: t.StringUrl, options?: RequestInit): Promise<Response>;
  head(url: t.StringUrl, options?: RequestInit): Promise<Response>;
  options(url: t.StringUrl, options?: RequestInit): Promise<Response>;

  put(url: t.StringUrl, body: O, options?: RequestInit): Promise<Response>;
  post(url: t.StringUrl, body: O, options?: RequestInit): Promise<Response>;
  patch(url: t.StringUrl, body: O, options?: RequestInit): Promise<Response>;

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
  readonly headers: t.HttpHeaders;
  get(name: string): t.StringHttpHeader;
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
