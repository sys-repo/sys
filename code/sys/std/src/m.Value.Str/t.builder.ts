import { type t } from './common.ts';

/** Options for creating a string builder. */
export type StrBuilderOptions = {
  /** End-of-line sequence. Defaults to '\n'. */
  readonly eol?: '\n' | '\r\n';
  /** Default content used when `line()` is called without an argument. Defaults to Str.SPACE. */
  readonly defaultEmpty?: string;
  /**
   * Default trim behavior for `toString()` and `toText()`
   * when not explicitly overridden. Defaults to true.
   */
  readonly trimEnd?: boolean;
};

/** Output shaping for `toText()` (call-level overrides). */
export type StrBuilderToTextOptions = {
  /** Trim trailing whitespace/newlines from the final output. */
  readonly trimEnd?: boolean;
  /** Ensure the final output ends with exactly one EOL. */
  readonly trailingNewline?: boolean;
};

/**
 * Mutable string builder with line-oriented ergonomics plus precise
 * output control. Methods are chainable and side-effect only on this instance.
 */
export type StrBuilder = {
  /** Append a line followed by EOL. If omitted, uses the configured `defaultEmpty`. */
  line(input?: string): StrBuilder;

  /** Append `count` empty lines (no content, only EOL). */
  blank(count?: number): StrBuilder;

  /** Append text verbatim (no EOL automatically added). */
  raw(text: string): StrBuilder;

  /** Append many lines (each item passed to `line`). */
  lines(items: readonly string[]): StrBuilder;

  /**
   * Render to string using defaults (typically `trimEnd: true`).
   * Equivalent to `toText()` with no options.
   */
  toString(): string;

  /**
   * Render to string with per-call shaping (does not mutate the buffer).
   * Options override instance defaults.
   */
  toText(options?: StrBuilderToTextOptions): string;
};
