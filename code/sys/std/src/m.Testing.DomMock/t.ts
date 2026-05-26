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
      /**
       * Creates a KeyboardEvent with the specified parameters.
       * @param type - The type of the event (e.g., 'keydown', 'keyup').
       * @param key - The key value of the key represented by the event.
       * @param keyCode - The numeric key code of the key represented by the event.
       * @param code - The physical key code (e.g., 'KeyZ'). Defaults to `Key${key.toUpperCase()}` if not provided.
       * @returns A new KeyboardEvent instance.
       */
      event(type: string, key?: string, keyCode?: number, code?: string): KeyboardEvent;

      /**
       * Creates a 'keydown' KeyboardEvent.
       * @param key - The key value. Defaults to 'z'.
       * @param keyCode - The key code. Defaults to 90.
       * @returns A new 'keydown' KeyboardEvent instance.
       */
      keydownEvent(key?: string, keyCode?: number): KeyboardEvent;

      /**
       * Creates a 'keyup' KeyboardEvent.
       * @param key - The key value. Defaults to 'z'.
       * @param keyCode - The key code. Defaults to 90.
       * @returns A new 'keyup' KeyboardEvent instance.
       */
      keyupEvent(key?: string, keyCode?: number): KeyboardEvent;

      /**
       * Dispatches a KeyboardEvent to the document. If no event is provided, it dispatches a default 'keydown' event.
       * @param event - The KeyboardEvent to dispatch. Defaults to a 'keydown' event if not provided.
       */
      fire(event?: KeyboardEvent): void;
    };
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
