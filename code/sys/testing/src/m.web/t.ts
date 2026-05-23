import type { t } from './common.ts';

/**
 * Test fixtures for Web Standards runtime primitives.
 */
export declare namespace WebFixture {
  /** Runtime library surface for Web Standards test fixtures. */
  export type Lib = {
    /** WebSocket global test fixtures. */
    readonly WebSocket: WebSocket.Lib;
  };

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
