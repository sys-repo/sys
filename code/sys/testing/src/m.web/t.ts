import type { t } from './common.ts';

/**
 * Test fixtures for Web Standards runtime primitives.
 */
export declare namespace WebFixture {
  /** Runtime library surface for Web Standards test fixtures. */
  export type Lib = {
    /** Fetch global test fixtures. */
    readonly Fetch: Fetch.Lib;
    /** WebSocket global test fixtures. */
    readonly WebSocket: WebSocket.Lib;
  };

  /** Fetch global test fixtures. */
  export namespace Fetch {
    /** Runtime library surface for Fetch test fixtures. */
    export type Lib = t.WebFixtureFetch.Lib;

    /** Factory for lifecycle-scoped replacement of `globalThis.fetch`. */
    export type MockFactory = t.WebFixtureFetch.MockFactory;

    /** Active Fetch mock handle with exact, idempotent, retryable restoration. */
    export type Mock = t.WebFixtureFetch.Mock;
  }

  /** WebSocket global test fixtures. */
  export namespace WebSocket {
    /** Runtime library surface for WebSocket test fixtures. */
    export type Lib = {
      /** Mock `globalThis.WebSocket` until the returned handle is disposed. */
      mock: MockFactory;
    };

    /** Factory for mocking `globalThis.WebSocket`. */
    export type MockFactory = () => Mock;

    /** Active WebSocket mock handle. */
    export type Mock = t.DisposableLike;
  }
}
