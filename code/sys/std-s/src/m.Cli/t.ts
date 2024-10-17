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

import type { ArgsLib, ValueLib } from '@sys/std/t';
import type { Ora as OraSpinner } from 'ora';
import type { t } from './common.ts';

/**
 * Tools for CLI's (command-line-interface).
 */
export type CliLib = {
  /**
   * Argument parsing helpers
   */
  readonly Args: ArgsLib;

  /**
   * Tools for working with CLI tables.
   */
  readonly Table: t.CliTableLib;

  /**
   * Tools for working with a CLI spinner.
   */
  readonly Spinner: t.CliSpinnerLib;

  /**
   * Tools for formatting standard output (strings) within a CLI.
   */
  readonly Format: CliFormatLib;

  /**
   * Tools for working on strings of text.
   */
  readonly Value: ValueLib;

  /**
   * Parse command-line argments into an object (argv).
   */
  args: ArgsLib['parse'];

  /**
   * Create a new Table generator instance.
   */
  table: t.CliTableLib['create'];

  /**
   * Create (and start) a new spinner instance.
   */
  spinner: t.CliSpinnerLib['create'];

  /**
   * Wait for the specified milliseconds.
   */
  wait: t.TimeLib['wait'];

  /**
   * Index of input prompts
   */
  readonly Prompts: t.CliPromptsLib;

  /**
   * Boolean: Yes/No confirmation.
   */
  confirm: t.CliPromptsLib['Confirm']['prompt'];
};

/**
 * Tools for working with CLI tables.
 */
export type CliTableLib = {
  /**
   * Create a new Table generator instance.
   */
  create(...items: string[][]): CliffyTable;
};

/**
 * Tools for working with a CLI spinner.
 */
export type CliSpinnerLib = {
  /**
   * Create (and start) a new spinner instance.
   */
  create(text?: string): OraSpinner;
};

/**
 * Index of input prompts.
 */
export type CliPromptsLib = {
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
 * Tools for formatting standard output (strings) within a CLI.
 */
export type CliFormatLib = {
  /**
   * Path color formatting.
   */
  path(path: string, fmt?: CliPathFormatter): string;
};

/**
 * A style agnostic formatter function for converting a string path
 * into a "pretty" display element, eg. formatted to the console with colors.
 */
export type CliPathFormatter = (e: CliPathFormatterArgs) => t.IgnoredResponse;
export type CliPathFormatterArgs = t.CliPathPart & {
  change(to: string): void;
  toString(): string;
};

/**
 * Represents a single "part" of a path as split by
 * the formatter.
 */
export type CliPathPart = {
  readonly index: t.Index;
  readonly kind: 'slash' | 'dirname' | 'basename';
  readonly text: string;
  readonly is: CliPathPartIs;
};

/**
 * Flags about a single "part" of a formatter path.
 */
export type CliPathPartIs = {
  readonly first: boolean;
  readonly last: boolean;
  readonly slash: boolean;
  readonly dirname: boolean;
  readonly basename: boolean;
};
