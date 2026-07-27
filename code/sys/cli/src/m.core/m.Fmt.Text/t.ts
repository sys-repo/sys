import type { t } from '../common.ts';

/**
 * Contracts for measuring, fitting, clipping, and wrapping terminal text.
 *
 * Widths are rendered cell counts; ANSI escape sequences consume no cells.
 */
export declare namespace CliFormatText {
  /**
   * Terminal-aware text measurement and layout helpers.
   */
  export type Lib = {
    /** Rendered terminal-cell width; ANSI escape codes consume no cells. */
    readonly visibleWidth: (input: string) => number;
    /** Pad a string to the requested visible width. */
    readonly padEnd: (input: string, width: number) => string;
    /** Return the largest visible width among the given strings. */
    readonly maxVisibleWidth: (inputs: readonly string[]) => number;
    /** Middle-ellipsize plain single-line text within a terminal-cell budget. */
    readonly ellipsize: (
      input: string,
      width: number,
      options?: Ellipsize.Options,
    ) => string;
    /** Resolve a fitted usable width from explicit, terminal, or fallback widths. */
    readonly fitWidth: (options?: Width.Fit.Options) => number;
    /** Soft-wrap prose and join the result with newlines. */
    readonly wrap: (input: string, options: Wrap.Options) => string;
    /** Soft-wrap prose into display lines. */
    readonly wrapLines: (input: string, options: Wrap.Options) => readonly string[];
  };

  /**
   * Policies for deriving usable terminal-cell widths.
   */
  export namespace Width {
    /**
     * Inputs for resolving a physical width into a layout budget.
     */
    export namespace Fit {
      /** Width fitting options for terminal-aware text layout. */
      export type Options = {
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
    }
  }

  /**
   * Policies for prose flow, indentation, and whole-line preservation.
   */
  export namespace Wrap {
    /** Prose wrapping options. */
    export type Options = {
      /** Maximum visible width for each rendered line; non-positive values disable soft wrapping. */
      readonly width: number;
      /** Number of spaces to prefix to the first rendered line. */
      readonly indent?: number;
      /** Number of spaces to prefix to wrapped and explicit continuation lines. */
      readonly continuationIndent?: number;
      /** Whole-line preservation policy. Defaults to command/reference preservation. */
      readonly preserve?: Preserve;
    };

    /** Whole-line preservation policy for wrapping. */
    export type Preserve = 'default' | 'none' | PreserveFn;

    /** Custom whole-line preservation predicate. */
    export type PreserveFn = (line: string) => boolean;
  }

  /**
   * Marker policy for middle-ellipsizing text within a cell budget.
   */
  export namespace Ellipsize {
    /** Options for terminal-cell-aware middle ellipsis. */
    export type Options = {
      /** Plain marker inserted between the retained start and end. Defaults to `…`. */
      readonly ellipsis?: string;
    };
  }
}
