import type { t } from '../common.ts';

/**
 * Contracts for measuring, fitting, clipping, and wrapping terminal text.
 *
 * Widths are terminal-cell counts. Measurement ignores ANSI escape sequences. `ellipsize` accepts
 * plain text only; callers apply and balance terminal styling after clipping.
 */
export declare namespace CliFormatText {
  /**
   * Terminal text operations grouped by width, wrapping, and clipping responsibility.
   */
  export type Lib = {
    /** Terminal-cell measurement and layout-budget operations. */
    readonly Width: Width.Lib;
    /** Whitespace-aware prose wrapping operations. */
    readonly Wrap: Wrap.Lib;
    /** Grapheme-safe middle clipping for plain, single-line text within a cell budget. */
    readonly ellipsize: (
      input: string,
      width: number,
      options?: Ellipsize.Options,
    ) => string;
  };

  /**
   * Contracts for measuring terminal text and deriving terminal-cell layout budgets.
   */
  export namespace Width {
    /**
     * Measures display width and derives usable widths without clipping content.
     */
    export type Lib = {
      /** Measure rendered terminal-cell width; ANSI escape sequences consume no cells. */
      readonly measure: (input: string) => number;
      /** Append spaces up to a normalized target width; never truncate wider input. */
      readonly padEnd: (input: string, width: number) => string;
      /** Return the greatest measured width, or `0` for an empty collection. */
      readonly max: (inputs: readonly string[]) => number;
      /** Derive a non-negative usable width after capping, reserve, and minimum policies. */
      readonly fit: (options?: Fit.Options) => number;
    };

    /**
     * Policy for selecting a physical width and deriving a usable layout budget.
     *
     * Source precedence is explicit width, detected terminal width, fallback width, maximum width,
     * then `80`. Finite numeric inputs are floored to integers. Non-positive source widths are
     * unavailable; reserve and minimum values normalize to zero.
     */
    export namespace Fit {
      /** Width fitting options for terminal-aware text layout. */
      export type Options = {
        /** Positive explicit source width; takes precedence over terminal measurement. */
        readonly width?: number;
        /** Positive source-width cap; also the last fallback before the default width. */
        readonly maxWidth?: number;
        /** Cells reserved for surrounding labels, gutters, or decoration. Defaults to `0`. */
        readonly reserve?: number;
        /** Usable-width threshold; fitted values below it collapse to `0`. Defaults to `0`. */
        readonly minWidth?: number;
        /** Fallback source width when terminal measurement is skipped or unavailable. */
        readonly fallbackWidth?: number;
        /** Standard stream used to detect terminal output. Defaults to `stdout`. */
        readonly stream?: t.StdioName;
        /** Terminal detection override. Defaults to the selected stream's detected state. */
        readonly terminal?: boolean;
      };
    }
  }

  /**
   * Contracts for whitespace-aware prose flow, indentation, and line preservation.
   *
   * Input CRLF sequences normalize to LF, leading and trailing blank lines are removed, and
   * explicit internal line boundaries are retained. Prose whitespace may normalize when a line
   * requires soft wrapping. Numeric layout values normalize to non-negative integers.
   */
  export namespace Wrap {
    /**
     * Presents the same wrapping operation as joined text or individual display lines.
     */
    export type Lib = {
      /** Soft-wrap prose at whitespace and join the resulting lines with `\n`. */
      readonly text: (input: string, options: Options) => string;
      /** Soft-wrap prose at whitespace and return the resulting display lines. */
      readonly lines: (input: string, options: Options) => readonly string[];
    };

    /** Prose wrapping and indentation policy. */
    export type Options = {
      /**
       * Target terminal-cell width, including formatter-added indentation. Non-positive values
       * disable soft wrapping. Preserved lines and indivisible words may exceed this target.
       */
      readonly width: number;
      /** Spaces prefixed to the first rendered line. Defaults to `0`. */
      readonly indent?: number;
      /**
       * Non-negative spaces prefixed to wrapped and explicit continuation lines. Defaults to
       * `indent`.
       */
      readonly continuationIndent?: number;
      /**
       * Whole-line preservation policy. Defaults to recognized code, command, and URL lines;
       * `none` disables those patterns and a predicate replaces them. Fenced blocks are always
       * preserved.
       */
      readonly preserve?: Preserve;
    };

    /** Built-in, disabled, or caller-defined whole-line preservation policy. */
    export type Preserve = 'default' | 'none' | PreserveFn;

    /** Predicate preserving a source line when true, before indentation or prose normalization. */
    export type PreserveFn = (line: string) => boolean;
  }

  /**
   * Plain-text marker policy for grapheme-safe middle clipping within a cell budget.
   */
  export namespace Ellipsize {
    /** Options for terminal-cell-aware middle clipping. */
    export type Options = {
      /** Plain marker used between retained ends and clipped if necessary. Defaults to `…`. */
      readonly ellipsis?: string;
    };
  }
}
