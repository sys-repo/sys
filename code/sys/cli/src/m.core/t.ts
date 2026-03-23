import type { ArgsLib, PathLib } from '@sys/std/t';
import type { t } from './common.ts';

/** Type re-exports. */
export type * from './m.Fmt/t.ts';
export type * from './m.Input/t.ts';
export type * from './m.Keyboard/t.ts';
export type * from './m.Prompt/t.ts';
export type * from './m.Screen/t.ts';
export type * from './m.Spinner/t.ts';
export type * from './m.Table/t.ts';
export type * from './u/t.ts';

/**
 * Tools for CLI's (command-line-interface).
 */
export type CliLib = {
  /** Argument parsing helpers */
  readonly Args: ArgsLib;

  /** Tools for for working with string paths. */
  readonly Path: PathLib;

  /** Tools for working with CLI tables. */
  readonly Table: t.CliTableLib;

  /** Tools for working with a CLI spinner. */
  readonly Spinner: t.CliSpinnerLib;

  /** Common formatting heleprs. */
  readonly Fmt: t.CliFormatLib;

  /** Tools for working with the keyboard within a CLI. */
  readonly Keyboard: t.CliKeyboardLib;

  /** Index of input prompts */
  readonly Input: t.CliInputLib;
  /** Direct access to low-level prompt primitives. */
  readonly Prompt: t.CliPromptLib; // ← available where direct access to prompt primitives is needed.

  /** Tools for working with a terminal screen. */
  readonly Screen: t.CliScreenLib;

  /** Parse command-line argments into an object (argv). */
  args: ArgsLib['parse'];

  /** Create a new Table generator instance. */
  table: t.CliTableLib['create'];

  /** Create (and start) a new spinner instance. */
  spinner: t.CliSpinnerLib['create'];

  /** Wait for the specified milliseconds. */
  wait: t.TimeLib['wait'];

  /** Listen to keypress events. */
  keypress: t.CliKeyboardLib['keypress'];

  /** Strip ANSI escape codes from a string. */
  stripAnsi(input: string): string;

  /** Copy arbitrary text to the system clipboard from a Deno CLI context. */
  copyToClipboard(text: string): Promise<t.CliCopyResult>;

  /**
   * Keep a long-running CLI process alive until Ctrl-C.
   *
   * Installs a SIGINT handler, forwards it to a lifecycle, waits for
   * disposal, then exits the process with the given exit code.
   */
  keepAlive: (options?: t.CliKeepAliveOptions) => Promise<never>;
};
