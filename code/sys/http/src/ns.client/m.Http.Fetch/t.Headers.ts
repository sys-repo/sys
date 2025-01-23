import type { t } from './common.ts';

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
