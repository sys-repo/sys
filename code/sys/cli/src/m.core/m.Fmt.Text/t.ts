import type { t } from '../common.ts';

/**
 * Contracts for measuring, fitting, clipping, and wrapping terminal text.
 *
 * Widths are terminal-cell counts. Measurement ignores ANSI escape sequences. `ellipsize` accepts
 * plain text and can render its clipped parts through a styling-only callback.
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
      readonly max: (inputs: string[]) => number;
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
        width?: number;
        /** Positive source-width cap; also the last fallback before the default width. */
        maxWidth?: number;
        /** Cells reserved for surrounding labels, gutters, or decoration. Defaults to `0`. */
        reserve?: number;
        /** Usable-width threshold; fitted values below it collapse to `0`. Defaults to `0`. */
        minWidth?: number;
        /** Fallback source width when terminal measurement is skipped or unavailable. */
        fallbackWidth?: number;
        /** Standard stream used to detect terminal output. Defaults to `stdout`. */
        stream?: t.StdioName;
        /** Terminal detection override. Defaults to the selected stream's detected state. */
        terminal?: boolean;
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
      width: number;
      /** Spaces prefixed to the first rendered line. Defaults to `0`. */
      indent?: number;
      /**
       * Non-negative spaces prefixed to wrapped and explicit continuation lines. Defaults to
       * `indent`.
       */
      continuationIndent?: number;
      /**
       * Whole-line preservation policy. Defaults to recognized code, command, and URL lines;
       * `none` disables those patterns and a predicate replaces them. Fenced blocks are always
       * preserved.
       */
      preserve?: Preserve;
    };

    /** Built-in, disabled, or caller-defined whole-line preservation policy. */
    export type Preserve = 'default' | 'none' | PreserveFn;

    /** Predicate preserving a source line when true, before indentation or prose normalization. */
    export type PreserveFn = (line: string) => boolean;
  }

  /**
   * Plain-text marker and styling-only rendering policy for grapheme-safe middle clipping.
   */
  export namespace Ellipsize {
    /** Options for terminal-cell-aware middle clipping. */
    export type Options = {
      /** Plain marker used between retained ends and clipped if necessary. Defaults to `…`. */
      ellipsis?: string;
      /**
       * Styling-only renderer invoked when clipping occurs. It must preserve the supplied visible
       * text and terminal-cell width while adding only balanced presentation sequences.
       */
      render?: Render;
    };

    /** Plain clipped fragments supplied to a styling-only renderer. */
    export type Parts = {
      /** Retained leading text. */
      readonly head: string;
      /** Plain marker between retained ends. */
      readonly ellipsis: string;
      /** Retained trailing text. */
      readonly tail: string;
    };

    /** Styling-only renderer for a clipped plain-text result. */
    export type Render = (parts: Parts) => string;
  }
}
