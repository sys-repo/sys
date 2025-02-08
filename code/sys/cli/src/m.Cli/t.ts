import type {
  Checkbox,
  Confirm,
  Input,
  List,
  Number,
  Secret,
  Select,
  Toggle,
} from '@cliffy/prompt';
import type { Table as CliffyTable } from '@cliffy/table';
import type { keypress as CliffyKeypress } from '@cliffy/keypress';

import type { ArgsLib, ValueLib, PathLib, PathFormatLib } from '@sys/std/t';
import type { Ora as OraSpinner } from 'ora';
import type { t } from './common.ts';

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

  /** Tools for working on strings of text. */
  readonly Value: ValueLib;

  /** Common formatting heleprs. */
  readonly Format: t.CliFormatLib;

  /** Tools for working with the keyboard within a CLI. */
  readonly Keyboard: t.CliKeyboardLib;

  /** Index of input prompts */
  readonly Prompt: t.CliPromptLib;

  /** Parse command-line argments into an object (argv). */
  args: ArgsLib['parse'];

  /** Create a new Table generator instance. */
  table: t.CliTableLib['create'];

  /** Create (and start) a new spinner instance. */
  spinner: t.CliSpinnerLib['create'];

  /** Wait for the specified milliseconds. */
  wait: t.TimeLib['wait'];

  /** Boolean: Yes/No confirmation. */
  confirm: t.CliPromptLib['Confirm']['prompt'];

  /** Listen to keypress events. */
  keypress: t.CliKeyboardLib['keypress'];

  /** Strip ANSI escape codes from a string. */
  stripAnsi(input: string): string;
};

/**
 * Tools for working with CLI tables.
 */
export type CliTableLib = {
  /**
   * Create a new Table generator instance.
   */
  create(...items: string[][]): CliTable;
};

/** Represents a table that can be written to the console. */
export type CliTable = CliffyTable;

/**
 * Tools for working with a CLI spinner.
 */
export type CliSpinnerLib = {
  /**
   * Create (and start) a new spinner instance.
   */
  create(text?: string, options?: { start?: boolean; silent?: boolean }): OraSpinner;
};

/**
 * Index of input prompts.
 */
export type CliPromptLib = {
  /**
   * Text input prompt (String).
   */
  readonly Input: typeof Input;

  /**
   * Yes/No confirmation input prompt (Boolean).
   */
  readonly Confirm: typeof Confirm;

  /**
   * Numeric input prompt (Number).
   */
  readonly Number: typeof Number;

  /**
   * Secret input prompt (String).
   */
  readonly Secret: typeof Secret;

  /**
   * Yes/No toggle input prompt (Boolean).
   */
  readonly Toggle: typeof Toggle;

  /**
   * List input prompt.
   */
  readonly List: typeof List;

  /**
   * Selection list input prompt.
   */
  readonly Select: typeof Select;

  /**
   * Multi-select list input propmt.
   */
  readonly Checkbox: typeof Checkbox;
};

/**
 * Common formatting helpers when working with a CLI.
 */
export type CliFormatLib = {
  /**
   * Path display formatting.
   */
  path: PathFormatLib['string'];
};

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
