import type { CliffyKeypress } from './t.ext.ts';

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
};
