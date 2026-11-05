/** Test-runner registration for sync or async callbacks with runner-owned context. */
export type TestHook = <T>(fn: (this: T) => void | Promise<void>) => void;

/**
 * Contracts for server-side DOM testing.
 */
export declare namespace DomMock {
  /** DOM setup, teardown, and test fixtures. */
  export type Lib = {
    /** DOM object fakes. */
    readonly Fake: Fake.Lib;

    /** Keyboard event construction and dispatch. */
    readonly Keyboard: Keyboard.Lib;

    /** Mouse event construction and dispatch. */
    readonly Mouse: Mouse.Lib;

    /** Touch-point and event construction without dispatch. */
    readonly Touch: Touch.Lib;

    /** Whether DomMock globals are installed. */
    readonly isPolyfilled: boolean;

    /**
     * Install DOM globals, creating a window on first use and reusing it thereafter.
     * A non-empty `url` creates another window; `unpolyfill` closes all created windows.
     */
    polyfill(options?: { url?: string }): void;

    /**
     * Restore the original globals synchronously, then close every owned window.
     * Await the returned promise to observe cleanup completion or failure.
     */
    unpolyfill(): Promise<void>;

    /**
     * Register async DOM setup and teardown with a test-runner hook pair.
     * Use `beforeEach`/`afterEach` for per-test isolation, or `beforeAll`/`afterAll`
     * for a shared suite DOM: `DomMock.init({ beforeAll, afterAll })`.
     */
    init(args: DomMockInitArgs): void;
  };

  /**
   * DOM object fakes for tests.
   */
  export namespace Fake {
    /** Fake object constructors. */
    export type Lib = {
      /** Media stream and track fakes. */
      readonly Media: Media.Lib;
    };

    /**
     * Media stream and track test doubles; no capture or playback.
     */
    export namespace Media {
      /** Media object construction without device access. */
      export type Lib = {
        /** Create a stream fake with no tracks; adding or removing tracks is a no-op. */
        stream(input?: Partial<{ id: string; active: boolean }>): MediaStream;

        /** Create a track fake; stopping it does not change its reported state. */
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
   * Mouse event construction and dispatch in the installed mock DOM.
   */
  export namespace Mouse {
    /** Event constructors, dispatch helpers, and down/up sequences. */
    export type Lib = {
      /**
       * Create a MouseEvent with `bubbles: true`, `cancelable: true`, and `button: 0`.
       * Explicit `init` fields override these defaults.
       */
      event(type: string, init?: MouseEventInit): MouseEvent;

      /** Create and dispatch an event to `el`, returning the event and dispatch result. */
      fire(el: EventTarget, type: string, init?: MouseEventInit): Dispatch;

      /** Dispatch a mousedown event. */
      down(el: EventTarget, init?: MouseEventInit): Dispatch;

      /** Dispatch a mouseup event. */
      up(el: EventTarget, init?: MouseEventInit): Dispatch;

      /** Dispatch a click event. */
      click(el: EventTarget, init?: MouseEventInit): Dispatch;

      /** Dispatch mousedown → mouseup; no click is synthesized. */
      activate(el: EventTarget, init?: MouseEventInit): Activation;
    };

    /** The event and `dispatchEvent` result: `false` when its default action was prevented. */
    export type Dispatch = { readonly event: MouseEvent; readonly dispatched: boolean };

    /** Results of the mousedown → mouseup sequence. */
    export type Activation = { readonly down: Dispatch; readonly up: Dispatch };
  }

  /**
   * Touch fixtures without gesture tracking or browser default actions.
   */
  export namespace Touch {
    /** Touch constructors; callers own contact lists and dispatch. */
    export type Lib = {
      /**
       * Create plain touch data, not a native Touch instance.
       * Identifier and target are required; optional numeric fields default to zero without inference.
       */
      point(init: TouchInit): globalThis.Touch;

      /**
       * Create an event in the target element's owning window without dispatching it.
       * Defaults to bubbling and cancelable. Omitted lists are empty; supplied lists retain
       * their independent membership, including on end/cancel. No contacts are inferred.
       * Throws if the target's document has no window.
       */
      event(target: Element, type: EventType, init?: TouchEventInit): TouchEvent;
    };

    /** Native touch lifecycle event names. */
    export type EventType = 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel';
  }

  /**
   * Keyboard event construction and document dispatch in the installed mock DOM.
   */
  export namespace Keyboard {
    /** Keyboard fixtures with inferred key codes and explicit overrides. */
    export type Lib = {
      /**
       * Create a KeyboardEvent, defaulting to key `z`.
       * Infer missing `code` and `keyCode` from the resolved key.
       * Init objects merge left to right; their fields override positional key/code values.
       */
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

      /** Dispatch to the installed document; omitted input creates a keydown event for `z`. */
      fire(event?: KeyboardEvent): void;
    };

    /** Native KeyboardEvent init plus legacy key-code fields used by tests. */
    export type EventInit = KeyboardEventInit & { keyCode?: number; which?: number };
  }
}

/** One matching setup/teardown hook pair: per-test or per-suite. */
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
