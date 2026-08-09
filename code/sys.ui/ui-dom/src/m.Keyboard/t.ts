import type { t } from './common.ts';

type KeyHandler = (e: KeyboardEvent) => unknown;

/**
 * Tools for working with the keyboard.
 */
export declare namespace Keyboard {
  /** Keyboard module runtime surface. */
  export type Lib = {
    /** Boolean flag evaluators. */
    readonly Is: Is.Lib;

    /** Keyboard event monitor. */
    readonly Monitor: Monitor.Lib;

    /** Helpers for matching key patterns. */
    readonly Match: Match.Lib;

    /** Registers a listener for keydown events. */
    onKeydown: Listener.Lib['keydown'];

    /** Registers a listener for keyup events. */
    onKeyup: Listener.Lib['keyup'];

    /** Registers listeners for key patterns through the monitor. */
    on: Monitor.On['on'];

    /** Filters key events using a condition before processing them through the monitor. */
    filter: Monitor.Lib['filter'];

    /** Listens for keyboard events until a condition is met. */
    until(until?: t.UntilInput): EventsUntil;

    /** Start a multi-key listener waiting for a "double-press" event. */
    dbl(threshold?: t.Msecs, options?: { until?: t.UntilInput }): Monitor.Multi;

    /** Convert a loose event-like input into standard modifier-key flags. */
    modifiers(e?: Partial<NativeEventLike | EventLike | Modifier.Flags>): Modifier.Flags;
  };

  /** Abstract native event shape for reading modifier flags. */
  export type NativeEventLike = {
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
  };

  /** Minimal keyboard event shape needed by helpers. */
  export type EventLike = {
    key: string;
    modifiers: Partial<Modifier.Flags>;
  };

  /** Lifecycle and streams of keyboard events until disposed. */
  export type EventsUntil = t.Lifecycle & globalThis.Disposable & {
    /** Observable stream of keyboard states. */
    $: t.Observable<State.Snapshot>;

    /** Observable stream of keyboard states for key up events. */
    up$: t.Observable<State.Snapshot>;

    /** Observable stream of keyboard states for key down events. */
    down$: t.Observable<State.Snapshot>;

    /** Filters keyboard events based on the monitor's filter. */
    filter: Monitor.Lib['filter'];

    /** Registers a listener for a specific keyboard pattern. */
    on: Monitor.Lib['on'];

    /** Tracks double key press events within a given time threshold. */
    dbl(threshold?: t.Msecs): Monitor.Multi;
  };

  /**
   * Boolean flag evaluators.
   */
  export namespace Is {
    /** Boolean flag evaluator surface. */
    export type Lib = {
      /**
       * Platform independent determination if the given flags conceptually align to command.
       *
       *    When on macOS™    →     ⌘  == meta
       *    When on Linux     →   ctrl == meta
       *    When on Windows™  →   ctrl == meta
       */
      command(
        modifiers?: Partial<NativeEventLike | EventLike | Modifier.Flags>,
        options?: { ua?: t.UserAgent.Info },
      ): boolean;

      /** Determine if any of the modifier flags are true. */
      modified(modifiers?: Partial<Modifier.Flags> | EventLike): boolean;

      /** Platform independent match on: Clipboard Copy. */
      copy(e?: EventLike, options?: { ua?: t.UserAgent.Info }): boolean;
    };
  }

  /**
   * Tools for listening to keyboard events.
   */
  export namespace Listener {
    /** Raw keydown/keyup listener surface. */
    export type Lib = {
      /** Indicates whether the current environment supports keyboard events. */
      readonly isSupported: boolean;

      /** Registers a listener for the `keydown` event. */
      keydown: (handler: KeyHandler) => Handle;

      /** Registers a listener for the `keyup` event. */
      keyup: (handler: KeyHandler) => Handle;
    };

    /** A disposable handler returned from a keyboard listener. */
    export type Handle = t.Lifecycle;
  }

  /**
   * Key pattern matching.
   */
  export namespace Match {
    /** Keyboard pattern matcher surface. */
    export type Lib = {
      /** Generate a keyboard pattern matcher from a loose input pattern. */
      pattern: (input: Pattern) => {
        /** Parsed key-map pattern, e.g. "CMD + KeyP" or "META + SHIFT + KeyL + KeyK". */
        pattern: string[];

        /** Determine if the given keys and modifiers match the pattern. */
        isMatch: (pressed: Key.Snapshot['code'][], modifiers: Partial<Modifier.Flags>) => boolean;
      };
    };

    /** A string representing a keyboard pattern to match. */
    export type Pattern = string;

    /** Key-match subscriber callback. */
    export type SubscriberHandler = (e: SubscriberHandlerArgs) => void;

    /** Key-match subscriber payload. */
    export type SubscriberHandlerArgs = {
      readonly pattern: Pattern;
      readonly state: State.Current;
      readonly event: Keypress.Event;

      /** Prevent native browser-default behavior only. */
      preventDefault(): void;

      /** Stop later keyboard pattern subscribers for this monitor emission only. */
      stopKeyboardPropagation(): void;

      /** Take exclusive ownership: prevent default, stop keyboard routing, and stop native DOM propagation. */
      consume(): void;
    };

    /** Map of keyboard patterns to subscribers. */
    export type Patterns = {
      readonly [pattern: Pattern]: SubscriberHandler;
    };
  }

  /**
   * Keyboard Monitor.
   */
  export namespace Monitor {
    /** Keyboard monitor surface. */
    export type Lib = On & {
      /** Observable that tracks the current keyboard state. */
      readonly $: t.Observable<State.Snapshot>;

      /** Current keyboard state. */
      readonly state: State.Snapshot;

      /** Boolean flags for the keyboard monitor. */
      readonly is: {
        readonly supported: boolean;
        readonly listening: boolean;
      };

      /** Starts the keyboard monitor. */
      start(): Lib;

      /** Stops the keyboard monitor. */
      stop(): void;

      /** Subscribes to keyboard state events. */
      subscribe(fn: (e: State.Snapshot) => void): Listener.Handle;

      /** Adds a filter before pattern listening. */
      filter(fn: () => boolean): On;
    };

    /** Methods for subscribing to keyboard events. */
    export type On = {
      /** Registers a listener for a specific keyboard pattern. */
      on(pattern: Match.Pattern, fn: Match.SubscriberHandler): Listener.Handle;

      /** Registers listeners for multiple key patterns. */
      on(patterns: Match.Patterns): Listener.Handle;
    };

    /** Multi-key monitor lifecycle. */
    export type Multi = t.Lifecycle & globalThis.Disposable & {
      on(pattern: Match.Pattern, fn: Match.SubscriberHandler): Listener.Handle;
    };
  }

  /**
   * Keyboard modifier-key contracts.
   */
  export namespace Modifier {
    /** Keyboard modifier keys that are on the edge of the keyboard. */
    export type Edges = [] | ['Left'] | ['Right'] | ['Left' | 'Right'];

    /** Keyboard modifier key constants. */
    export type Key = 'SHIFT' | 'CTRL' | 'ALT' | 'META';

    /** Pressed modifier key edges by modifier. */
    export type Keys = {
      shift: Edges;
      ctrl: Edges;
      alt: Edges;
      meta: Edges;
    };

    /** Modifier flags related to keyboard events. */
    export type Flags = {
      shift: boolean;
      ctrl: boolean;
      alt: boolean;
      meta: boolean;
    };
  }

  /**
   * Keyboard state contracts.
   */
  export namespace State {
    /** Keyboard state snapshot. */
    export type Snapshot = {
      current: Current;
      last?: Keypress.Event;
    };

    /** Current keyboard state. */
    export type Current = {
      modified: boolean;
      modifierKeys: Modifier.Keys;
      modifiers: Modifier.Flags;
      pressed: Key.Snapshot[];
    };
  }

  /**
   * Keyboard key contracts.
   */
  export namespace Key {
    /** Snapshot of a pressed key. */
    export type Snapshot = {
      key: string;
      code: string;
      is: Flags;
      timestamp: number;
    };

    /** Flags related to keyboard events. */
    export type Flags = {
      readonly os: { mac: boolean; windows: boolean };
      readonly down: boolean;
      readonly up: boolean;
      readonly modifier: boolean;
      readonly number: boolean;
      readonly letter: boolean;
      readonly enter: boolean;
      readonly escape: boolean;
      readonly arrow: boolean;
      readonly handled: boolean;
      readonly alt: boolean;
      readonly ctrl: boolean;
      readonly meta: boolean;
      readonly shift: boolean;
      readonly cut: boolean;
      readonly copy: boolean;
      readonly paste: boolean;
    };
  }

  /**
   * Keypress contracts.
   */
  export namespace Keypress {
    /** Lifecycle of a keypress. */
    export type Stage = 'Down' | 'Up';

    /** Keyboard keypress event. */
    export type Event = {
      readonly stage: Stage;
      readonly code: string;
      readonly keypress: Props;
      readonly is: Key.Flags;
    };

    /** Native keypress properties. */
    export type Props = {
      readonly code: string;
      readonly key: string;
      readonly isComposing: boolean;
      readonly location: number;
      readonly repeat: boolean;
      readonly altKey: boolean;
      readonly ctrlKey: boolean;
      readonly metaKey: boolean;
      readonly shiftKey: boolean;
      readonly bubbles: boolean;
      readonly cancelable: boolean;
      readonly eventPhase: number;
      readonly timeStamp: number;
      readonly isTrusted: boolean;
    };
  }
}
