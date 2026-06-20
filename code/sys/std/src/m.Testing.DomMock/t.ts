import type { t } from './common.ts';

export type TestHook = <T>(fn: (this: T) => void | Promise<void>) => void;

/**
 * DOM mock contracts.
 */
export namespace DomMock {
  /**
   * Represents the overall DOM Mock Library.
   */
  export type Lib = {
    /** DOM related test fakes. */
    readonly Fake: Fake.Lib;

    /** Keyboard event utilities. */
    readonly Keyboard: Keyboard.Lib;

    /** Flag indicating if the environment is currently poly-filled with the dom-mocks. */
    readonly isPolyfilled: boolean;

    /** Ensure `globalThis` is polyfilled with window/document. */
    polyfill(options?: { url?: string }): void;

    /** Returns the `globalThis` to it's original state. */
    unpolyfill(): void;

    /**
     * Registers DomMock lifecycle with the test runner.
     *
     * Usage:
     *   DomMock.init({ beforeAll, afterAll });
     *
     * Notes:
     * - Keeps setup/teardown explicit at the call site.
     * - Supports async hooks (Promise-returning) and runner-provided `this` context.
     */
    init(args: DomMockInitArgs): void;
  };

  /**
   * DOM mock fake contracts.
   */
  export namespace Fake {
    /**
     * DOM related test fakes.
     */
    export type Lib = {
      /** Media stream and track fakes. */
      readonly Media: Media.Lib;
    };

    /**
     * Media fake contracts.
     */
    export namespace Media {
      /**
       * Media stream and track fake helpers.
       */
      export type Lib = {
        stream(input?: Partial<{ id: string; active: boolean }>): MediaStream;
        track(
          input?: Partial<{
            id: string;
            kind: 'audio' | 'video';
            enabled: boolean;
            readyState: MediaStreamTrackState;
            label: string;
            settings: MediaTrackSettings;
            muted: boolean;
          }>,
        ): MediaStreamTrack;
      };
    }
  }

  /**
   * Keyboard event utility contracts.
   */
  export namespace Keyboard {
    /**
     * Helpers for testing keyboard events in unit-tests.
     */
    export type Lib = {
      /** Create a KeyboardEvent with inferred defaults and optional native init fields. */
      event(
        type: string,
        key?: string,
        keyCode?: number | EventInit,
        code?: string | EventInit,
        init?: EventInit,
      ): KeyboardEvent;

      /** Create a keydown KeyboardEvent. */
      keydownEvent(key?: string, keyCode?: number | EventInit, init?: EventInit): KeyboardEvent;

      /** Create a keyup KeyboardEvent. */
      keyupEvent(key?: string, keyCode?: number | EventInit, init?: EventInit): KeyboardEvent;

      /** Dispatch a KeyboardEvent to the document. */
      fire(event?: KeyboardEvent): void;
    };

    /** Native KeyboardEvent init plus legacy key-code fields used by tests. */
    export type EventInit = KeyboardEventInit & { keyCode?: number; which?: number };
  }
}

export type DomMockInitArgs =
  | {
    readonly beforeEach: TestHook;
    readonly afterEach: TestHook;
    readonly beforeAll?: undefined;
    readonly afterAll?: undefined;
  }
  | {
    readonly beforeAll: TestHook;
    readonly afterAll: TestHook;
    readonly beforeEach?: undefined;
    readonly afterEach?: undefined;
  };
