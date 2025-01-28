import { type t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Argument parsing tools.
 */
export type ArgsLib = {
  /** Parse command line arguments. */
  parse<T extends O = O>(argv?: string[], options?: t.ParseArgsOptions): ParsedArgs<T>;
};

/**
 * Parse command line arguments.
 */
export type ParseArgs = ArgsLib['parse'];

/**
 * Shape of the parsed arguments returned by `parseArgs`
 * - `_` holds all positional arguments (non-flag arguments).
 */
export type ParsedArgs<T extends O = O> = T & { _: string[] };

/**
 * Options for parsing command-line arguments
 */
export type ParseArgsOptions = {
  /**
   * Argument names to process as boolean flags.
   * If passed on the command line, these will result in either `true` or `false`.
   */
  boolean?: string[];

  /**
   * Argument names to process as string values.
   * Their values will always be strings even if they look numeric.
   */
  string?: string[];

  /**
   * Default values for named arguments. If an argument is not found on the command line,
   * it will assume this default.
   */
  default?: Record<string, unknown>;

  /**
   * An object of aliases. For instance, `{ n: 'name' }` means `-n <value>` is the same as `--name <value>`.
   */
  alias?: Record<string, string | string[]>;

  /**
   * If `true`, stops parsing on the first non-option argument.
   * All subsequent arguments are collected in the `._` array.
   */
  stopEarly?: boolean;

  /**
   * A function that is invoked when encountering an unknown flag.
   * Return `false` to disallow the unknown flag.
   */
  unknown?: (arg: string) => boolean;
};
