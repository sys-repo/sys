import type { t } from './common.ts';

/**
 * Tools for working with the `fetch` function in system/standard ways.
 */
export type HttpFetchLib = {
  /** Fetch helper that can cancel fetch operations mid-stream. */
  disposable(until$?: t.UntilObservable): t.HttpDisposableFetch;
};

/**
 * A `fetch` helper that implements the `disposable` pattern using
 * an AbortController and signals to cancel fetch operations mid-stream.
 */
export type HttpDisposableFetch = t.Lifecycle & {
  /** Invoke a fetch to retrieve JSON. */
  json<T>(input: RequestInfo | URL, options?: RequestInit): Promise<t.FetchResponse<T>>;
};
