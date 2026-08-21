import type { t } from './common.ts';
import type { CliffyKeypress, CliffyKeyPressEvent } from '../t.ext.ts';

/** Partial keypress input; missing fields are rejected by the redraw predicate. */
type RedrawInput = Partial<
  Pick<CliffyKeyPressEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey'>
>;

/**
 * Tools for owning keyboard input within a CLI lifecycle.
 */
export declare namespace CliKeyboard {
  /** CLI keyboard lifecycle library contract. */
  export type Lib = {
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
    isQuit(event: Event): boolean;

    /** True only for lowercase `r` with every modifier explicitly false. */
    isRedraw(event: RedrawInput): boolean;

    /** True for expected keyboard-listener failures in non-terminal runtimes. */
    isUnavailableError(error: unknown): boolean;

    /** Bind canonical terminal keyboard controls to callbacks. */
    bind(options: Bind.Options): Bind.Handle | undefined;

    /** Request disposal, retry once, and wait until autonomous listener work terminates. */
    shutdown(handle: Bind.Handle): Promise<void>;
  };

  /** Minimal keypress shape used by CLI keyboard predicates. */
  export type Event = Pick<CliffyKeyPressEvent, 'key' | 'ctrlKey'>;

  /**
   * Keyboard binding types.
   */
  export namespace Bind {
    /** Options for binding terminal keyboard controls. */
    export type Options = {
      /** Called for non-quit keypress events. */
      readonly onKey?: (event: CliffyKeyPressEvent) => void | Promise<void>;

      /** Called when the canonical quit keys are pressed. */
      readonly onQuit: () => void | Promise<void>;

      /** Optional lifecycle boundary that requests keyboard shutdown. */
      readonly until?: PromiseLike<unknown>;

      /** Exit the process after `onQuit` completes. Defaults false. */
      readonly exit?: boolean;

      /** Handle fixed package-owned keyboard listener failure. Defaults to rejecting `finished`. */
      readonly onError?: (error: unknown) => void | Promise<void>;
    };

    /**
     * Caller-owned keyboard listener handle.
     *
     * Disposal requests lower shutdown; `finished` settles only after autonomous listener work has
     * actually stopped.
     */
    export type Handle = t.DisposableLike & t.WaitableHandle & {
      readonly finished: Promise<void>;
    };
  }
}
