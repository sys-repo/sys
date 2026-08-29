import type { t } from './common.ts';
import type { CliffyKeypress, CliffyKeyPressEvent } from '../t.ext.ts';

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

    /** Predicates for canonical keyboard controls and listener failures. */
    readonly Is: Is.Lib;

    /** Bind canonical terminal keyboard controls to callbacks. */
    bind(options: Bind.Options): Bind.Handle | undefined;

    /** Request disposal, retry once, and wait until autonomous listener work terminates. */
    shutdown(handle: Bind.Handle): Promise<void>;
  };

  /**
   * Keyboard predicate types.
   */
  export namespace Is {
    /** Predicate library for canonical keyboard controls and listener failures. */
    export type Lib = {
      /** True for canonical terminal quit keys. */
      quit(event: QuitInput): boolean;

      /** True only for lowercase `r` with every modifier explicitly false. */
      redraw(event: RedrawInput): boolean;

      /** True for expected keyboard-listener failures in non-terminal runtimes. */
      unavailableError(error: unknown): boolean;
    };

    /** Minimal keypress shape required by the canonical quit predicate. */
    export type QuitInput = Pick<CliffyKeyPressEvent, 'key' | 'ctrlKey'>;

    /** Partial keypress input; missing fields are rejected by the redraw predicate. */
    export type RedrawInput = Partial<
      Pick<CliffyKeyPressEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey'>
    >;
  }

  /**
   * Keyboard binding types.
   */
  export namespace Bind {
    /**
     * Quit-key grammar owned by one keyboard binding.
     *
     * `canonical` intercepts `q` and Ctrl+C. `interrupt-only` intercepts only Ctrl+C, allowing `q`
     * to flow through `onKey`.
     */
    export type QuitKeys = 'canonical' | 'interrupt-only';

    /** Result of one non-quit key callback; `stop` ends the binding. */
    export type OnKeyResult = 'stop' | void;

    /** Options for binding terminal keyboard controls. */
    export type Options = {
      /** Called for keypress events not admitted by `quitKeys`. */
      onKey?: (event: CliffyKeyPressEvent) => OnKeyResult | Promise<OnKeyResult>;

      /** Called when an admitted quit key is pressed. */
      onQuit: () => void | Promise<void>;

      /** Quit-key grammar. Defaults to `canonical`. */
      quitKeys?: QuitKeys;

      /** Optional lifecycle boundary that requests keyboard shutdown. */
      until?: PromiseLike<unknown>;

      /** Exit the process after `onQuit` completes. Defaults false. */
      exit?: boolean;

      /** Handle fixed package-owned keyboard listener failure. Defaults to rejecting `finished`. */
      onError?: (error: unknown) => void | Promise<void>;
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
