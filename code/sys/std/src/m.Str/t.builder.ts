import { type t } from './common.ts';

/** Options for creating a string builder. */
export type StrBuilderOptions = {
  /** End-of-line sequence. Defaults to '\n'. */
  readonly eol?: '\n' | '\r\n';

  /**
   * Default content used when `line()` is called without an argument.
   * Defaults to Str.SPACE.
   */
  readonly defaultEmpty?: string;

  /**
   * Default content used for `blank()` lines.
   * Defaults to Str.SPACE to prevent CLI/TTY collapse.
   */
  readonly defaultBlank?: string;

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
  /**
   * Append a line followed by EOL.
   * If omitted, uses the configured `defaultEmpty`.
   */
  line(input?: string): StrBuilder;

  /**
   * Append `count` intentional blank lines.
   * Uses the configured `defaultBlank` to prevent collapse.
   */
  blank(count?: number): StrBuilder;

  /**
   * Append `count` truly empty lines (EOL only).
   * These lines may be collapsed or trimmed by renderers.
   */
  empty(count?: number): StrBuilder;

  /** Append text verbatim (no EOL automatically added). */
  raw(text: string): StrBuilder;

  /** Append many lines (each item passed to `line`). */
  lines(items: t.Ary<string>): StrBuilder;

  /**
   * Execute a scoped, indented block. All lines written via the provided
   * builder are prefixed with the given number of spaces, while sharing
   * the same underlying buffer.
   *
   * This does not mutate any global indent state; indentation is confined
   * to the duration of the callback.
   */
  indent(spaces: number, fn: (b: StrBuilder) => void): StrBuilder;

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
