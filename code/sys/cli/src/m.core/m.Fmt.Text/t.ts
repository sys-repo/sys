import type { t } from '../common.ts';

/** Shared text fitting and wrapping formatter surface. */
export type CliFormatTextLib = {
  /** Visible string width after ANSI escape codes are stripped. */
  readonly visibleWidth: (input: string) => number;
  /** Pad a string to the requested visible width. */
  readonly padEnd: (input: string, width: number) => string;
  /** Return the largest visible width among the given strings. */
  readonly maxVisibleWidth: (inputs: readonly string[]) => number;
  /** Resolve a fitted usable width from explicit, terminal, or fallback widths. */
  readonly fitWidth: (options?: CliFormatTextFitOptions) => number;
  /** Soft-wrap prose and join the result with newlines. */
  readonly wrap: (input: string, options: CliFormatTextWrapOptions) => string;
  /** Soft-wrap prose into display lines. */
  readonly wrapLines: (input: string, options: CliFormatTextWrapOptions) => readonly string[];
};

/** Width fitting options for terminal-aware text layout. */
export type CliFormatTextFitOptions = {
  /** Explicit physical width. Takes precedence over terminal measurement. */
  readonly width?: number;
  /** Maximum readable width before subtracting reserve. */
  readonly maxWidth?: number;
  /** Width reserved for surrounding layout such as labels and gutters. */
  readonly reserve?: number;
  /** Minimum usable width; returns `0` when the fitted width falls below it. */
  readonly minWidth?: number;
  /** Deterministic width used when terminal width is unavailable. Defaults to `80`. */
  readonly fallbackWidth?: number;
  /** Standard stream used to detect terminal output. Defaults to `stdout`. */
  readonly stream?: t.StdioName;
  /** Terminal detection override for deterministic tests. */
  readonly terminal?: boolean;
};

/** Prose wrapping options. */
export type CliFormatTextWrapOptions = {
  /** Maximum visible width for each rendered line; non-positive values disable soft wrapping. */
  readonly width: number;
  /** Number of spaces to prefix to the first rendered line. */
  readonly indent?: number;
  /** Number of spaces to prefix to wrapped and explicit continuation lines. */
  readonly continuationIndent?: number;
  /** Whole-line preservation policy. Defaults to command/reference preservation. */
  readonly preserve?: CliFormatTextPreserve;
};

/** Custom whole-line preservation predicate. */
export type CliFormatTextPreserveFn = (line: string) => boolean;

/** Whole-line preservation policy for wrapping. */
export type CliFormatTextPreserve = 'default' | 'none' | CliFormatTextPreserveFn;
