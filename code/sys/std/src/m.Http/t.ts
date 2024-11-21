import type { t } from '../common/mod.ts';

type O = Record<string, unknown>;

/** HTTP header verbs. */
export type HttpMethod = 'HEAD' | 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH' | 'OPTIONS';

/** An object map of HTTP headers. */
export type HttpHeaders = { readonly [key: t.StringHttpHeaderName]: t.StringHttpHeader };

/**
 * @module
 * HTTP tools.
 */
export type HttpLib = {
  /** Tools for working with the `fetch` function in system/standard ways. */
  readonly Fetch: t.HttpFetchLib;

  /** HTTP client tools (GET, PUT, POST, DELETE over Fetch). */
  readonly Client: t.HttpClientLib;

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
