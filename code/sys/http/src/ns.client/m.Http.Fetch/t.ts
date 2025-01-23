import type { t } from './common.ts';

type RequestInput = RequestInfo | URL;

/**
 * Tools for working with the `fetch` function in system/standard ways.
 */
export type HttpFetchLib = {
  /**
   * Fetch helper that can cancel fetch operations mid-stream.
   */
  create(until$?: t.UntilObservable): t.HttpFetch;
};

/**
 * A `fetch` helper that implements the `disposable` pattern using
 * an AbortController and signals to cancel fetch operations mid-stream.
 */
export type HttpFetch = t.Lifecycle & {
  /** Invoke a fetch to retrieve "application/json". */
  json<T>(
    input: RequestInput,
    init?: RequestInit,
    options?: t.HttpFetchOptions,
  ): Promise<t.FetchResponse<T>>;

  /** Invoke a fetch to retrieve "text/plain". */
  text(
    input: RequestInput,
    init?: RequestInit,
    options?: t.HttpFetchOptions,
  ): Promise<t.FetchResponse<string>>;
};

/** Optoins passed to the `fetch.text` method. */
export type HttpFetchOptions = { checksum?: t.StringHash };
