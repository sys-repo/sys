import type { t } from '../common.ts';
import type { CliffyKeypress, CliffyKeyPressEvent } from '../t.ext.ts';

/**
 * Tools for working with the keyboard within a CLI.
 */
export type CliKeyboardLib = {
  /**
   * Listen to keypress events.
   *
   * @example
   * ```ts
   * for await (const e of Cli.keypress()) {
   *   if (e.key === 'o' && e.ctrlKey) {
   *      ...
   *   }
   * }
   * ```
   */
  readonly keypress: typeof CliffyKeypress;

  /** True for canonical terminal quit keys. */
  isQuit(event: CliKeyboardEvent): boolean;

  /** True for expected keyboard-listener failures in non-terminal runtimes. */
  isUnavailableError(error: unknown): boolean;

  /** Bind canonical terminal keyboard controls to callbacks. */
  bind(options: CliKeyboardBindOptions): CliKeyboardBindHandle | undefined;
};

/** Minimal keypress shape used by CLI keyboard predicates. */
export type CliKeyboardEvent = Pick<CliffyKeyPressEvent, 'key' | 'ctrlKey'>;

/** Options for binding terminal keyboard controls. */
export type CliKeyboardBindOptions = {
  /** Called for non-quit keypress events. */
  readonly onKey?: (event: CliffyKeyPressEvent) => void | Promise<void>;

  /** Called when the canonical quit keys are pressed. */
  readonly onQuit: () => void | Promise<void>;

  /** Optional lifecycle boundary that disposes the keyboard listener. */
  readonly until?: PromiseLike<unknown>;

  /** Exit the process after `onQuit` completes. Defaults false. */
  readonly exit?: boolean;

  /** Handle unexpected keyboard listener errors. Defaults to rejecting `finished`. */
  readonly onError?: (error: unknown) => void;
};

/** Handle returned from a bound keyboard listener. */
export type CliKeyboardBindHandle = t.DisposableLike & t.WaitableHandle & {
  readonly finished: Promise<void>;
};
