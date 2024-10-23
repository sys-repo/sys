import type { t } from './common.ts';

type KeyHandler = (e: KeyboardEvent) => unknown;

/**
 * Tools for working with the keyboard.
 */
export type KeyboardLib = {
  /**
   * Keyboard event monitor.
   */
  Monitor: t.KeyboardMonitor;

  /**
   * Helpers for matching key patterns.
   */
  Match: t.KeyboardMatchLib;

  /**
   * Registers a listener for keydown events.
   * @param fn - A function to be executed when the keydown event occurs.
   * @returns A handle to manage the keydown event listener.
   */
  onKeydown: t.KeyboardListener['keydown'];

  /**
   * Registers a listener for keyup events.
   *
   * @param fn - A function to be executed when a keyup event occurs.
   * @returns A handle to manage the keyup event listener.
   */
  onKeyup: t.KeyboardListener['keyup'];

  /**
   * Registers listeners for key patterns through the monitor.
   */
  on: t.KeyboardMonitorOn['on'];

  /**
   * Filters key events using a condition before processing them through the monitor.
   */
  filter: t.KeyboardMonitor['filter'];

  /**
   * Converts keypress event data into a structured format.
   * @param event - The keypress event to be transformed.
   * @returns A structured keypress object.
   */
  toKeypress(e: KeyboardEvent): t.KeyboardKeypress;

  /**
   * A utility function that listens for a keyboard event until a condition is met.
   *
   * @param fn - A function that defines the condition for stopping the listener.
   * @returns A promise that resolves when the condition is met.
   */
  until(dispose$?: t.UntilObservable): t.KeyboardEventsUntil;

  /**
   * Start a multi-key listener waiting for a "double-press" event.
   */
  dbl(threshold?: t.Msecs, options?: { dispose$?: t.UntilObservable }): t.KeyboardMonitorMulti;
};

/**
 * Represents the lifecycle and streams of keyboard events
 * until disposed.
 */
export type KeyboardEventsUntil = t.Lifecycle & {
  /**
   * Observable stream of keyboard states.
   */
  $: t.Observable<t.KeyboardState>;

  /**
   * Observable stream of keyboard states for key up events.
   */
  up$: t.Observable<t.KeyboardState>;

  /**
   * Observable stream of keyboard states for key down events.
   */
  down$: t.Observable<t.KeyboardState>;

  /**
   * Filters keyboard events based on the monitor's filter.
   */
  filter: t.KeyboardMonitor['filter'];

  /**
   * Registers a listener for a specific keyboard pattern.
   */
  on: t.KeyboardMonitor['on'];

  /**
   * Tracks double key press events within a given time threshold.
   */
  dbl(threshold?: t.Msecs): t.KeyboardMonitorMulti;
};

/**
 * Tools for listening to keyboard events.
 */
export type KeyboardListener = {
  /**
   * Indicates whether the current environment supports keyboard events.
   * @type {boolean}
   * @readonly
   */
  readonly isSupported: boolean;

  /**
   * Registers a listener for the 'keydown' event.
   *
   * @param {KeyHandler} handler - The callback function to handle the event.
   * @returns {t.KeyListenerHandle} A disposable object that allows removing the event listener.
   */
  keydown: (handler: KeyHandler) => t.KeyListenerHandle;

  /**
   * Registers a listener for the 'keyup' event.
   *
   * @param {KeyHandler} handler - The callback function to handle the event.
   * @returns {t.KeyListenerHandle} A disposable object that allows removing the event listener.
   */
  keyup: (handler: KeyHandler) => t.KeyListenerHandle;
};

/**
 * A disposable handler returned from a keyboard listener.
 */
export type KeyListenerHandle = t.Lifecycle;

/**
 * A string representing a keyboard patter to match.
 */
export type KeyPattern = string; // eg. "CMD + K"

/**
 * Lifecycle of a keypress.
 */
export type KeyPressStage = 'Down' | 'Up';

/**
 * Keyboard modifier keys that are on the edge of the keyboard.
 */
export type KeyboardModifierEdges = [] | ['Left'] | ['Right'] | ['Left' | 'Right'];

/**
 * Keyboard modifier key constants.
 */
export type KeyboardModifierKey = 'SHIFT' | 'CTRL' | 'ALT' | 'META';

/**
 * Flags related to keyboard events.
 */
export type KeyboardKeyFlags = {
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

/**
 * The Match object is responsible for generating keyboard pattern matchers.
 */
export type KeyboardMatchLib = {
  /**
   * Generate a keyboard pattern matcher from a given input pattern.
   * @param input - The input keyboard pattern to be parsed.
   * @returns A matcher object.
   */
  pattern: (input: t.KeyPattern) => {
    /**
     * Parsed key-map pattern, e.g., "CMD + KeyP" or "META + SHIFT + KeyL + KeyK".
     */
    pattern: string[];

    /**
     * Determine if the given keys and modifiers match the pattern.
     * @param pressed - The array of pressed keyboard keys (codes).
     * @param modifiers - The object containing modifier flags (e.g., Shift, Ctrl).
     * @returns `true` if the keys and modifiers match the pattern, `false` otherwise.
     */
    isMatch: (
      pressed: t.KeyboardKey['code'][],
      modifiers: Partial<t.KeyboardModifierFlags>,
    ) => boolean;
  };
};

/**
 * Keyboard Monitor.
 */
export type KeyboardMonitor = KeyboardMonitorOn & {
  /**
   * An observable that tracks the current keyboard state.
   */
  readonly $: t.Observable<t.KeyboardState>;

  /**
   * The current state of the keyboard.
   */
  readonly state: t.KeyboardState;

  /**
   * A set of boolean flags for the keyboard monitor.
   */
  readonly is: {
    /**
     * Indicates whether the current environment supports keyboard monitoring.
     */
    readonly supported: boolean;
    /**
     * Indicates whether the monitor is currently listening for keyboard events.
     */
    readonly listening: boolean;
  };

  /**
   * Starts the keyboard monitor, enabling it to listen for events.
   * @returns The current instance of `KeyboardMonitor` for chaining.
   */
  start(): KeyboardMonitor;

  /**
   * Stops the keyboard monitor, preventing it from listening for further events.
   */
  stop(): void;

  /**
   * Subscribes to keyboard events.
   * @param fn - A function to execute on each keyboard state change.
   * @returns A handle to manage the subscription (e.g., for unsubscribing later).
   */
  subscribe(fn: (e: t.KeyboardState) => void): KeyListenerHandle;

  /**
   * Adds a filter to the monitor, allowing it to selectively listen for events.
   * @param fn - A function that returns a boolean to determine whether to listen for the event.
   * @returns The `KeyboardMonitorOn` interface to continue pattern listening.
   */
  filter(fn: () => boolean): KeyboardMonitorOn;
};

/**
 * Methods for subscribing to keyboard events.
 */
export type KeyboardMonitorOn = {
  /**
   * Registers a listener for a specific keyboard pattern.
   *
   * @param pattern - The keyboard pattern to listen for, e.g., "CMD + KeyP".
   * @param fn - A function to execute when the key pattern is matched.
   * @returns A handle to manage the key listener (e.g., for removing it later).
   */
  on(pattern: t.KeyPattern, fn: t.KeyMatchSubscriberHandler): KeyListenerHandle;

  /**
   * Registers listeners for multiple key patterns.
   *
   * @param patterns - An object containing multiple key patterns to listen for.
   * @returns A handle to manage the key listener (e.g., for removing it later).
   */
  on(patterns: KeyMatchPatterns): KeyListenerHandle;
};

export type KeyboardMonitorMulti = t.Lifecycle & {
  on(pattern: t.KeyPattern, fn: t.KeyMatchSubscriberHandler): t.KeyListenerHandle;
};

/**
 * Key pattern matching.
 */
export type KeyMatchSubscriberHandler = (e: KeyMatchSubscriberHandlerArgs) => void;
export type KeyMatchSubscriberHandlerArgs = {
  readonly pattern: t.KeyPattern;
  readonly state: t.KeyboardStateCurrent;
  readonly event: t.KeyboardKeypress;
  handled(): void;
};

export type KeyMatchPatterns = {
  readonly [pattern: t.KeyPattern]: t.KeyMatchSubscriberHandler;
};

/**
 * State.
 */
export type KeyboardKey = { key: string; code: string; is: KeyboardKeyFlags; timestamp: number };
export type KeyboardState = {
  current: KeyboardStateCurrent;
  last?: KeyboardKeypress;
};

export type KeyboardStateCurrent = {
  modified: boolean;
  modifierKeys: KeyboardModifierKeys;
  modifiers: KeyboardModifierFlags;
  pressed: KeyboardKey[];
};

export type KeyboardModifierKeys = {
  shift: KeyboardModifierEdges;
  ctrl: KeyboardModifierEdges;
  alt: KeyboardModifierEdges;
  meta: KeyboardModifierEdges;
};
export type KeyboardModifierFlags = {
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
};

/**
 * Keypress
 */
export type KeyboardKeypress = {
  readonly stage: KeyPressStage;
  readonly code: string;
  readonly keypress: KeyboardKeypressProps;
  readonly is: KeyboardKeyFlags;
  handled(): void;
};

export type KeyboardKeypressProps = {
  readonly code: string;
  readonly key: string;
  readonly isComposing: boolean;
  readonly location: number;
  readonly repeat: boolean;
  handled(): void;
} & t.UIEventBase &
  t.UIModifierKeys;
