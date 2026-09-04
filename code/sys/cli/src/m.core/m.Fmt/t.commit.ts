import type { t } from '../common.ts';

/**
 * Contracts for rendering styled commit-message suggestions in terminal output.
 */
export declare namespace CliFormatCommit {
  /**
   * Renders commit-message suggestion blocks.
   */
  export type Lib = {
    /** Render a message with optional title, indentation, and text styling. */
    suggestion(message: string, options?: Options): string;
  };

  /** Commit suggestion formatting options. */
  export type Options = {
    /** Title content and styling; `false` omits the title. */
    readonly title?: Title;
    /** Spaces prefixed to every rendered line. Defaults to `0`. */
    readonly indent?: number;
    /** Styling applied to the commit message. */
    readonly message?: Text;
  };

  /** Commit suggestion title options. */
  export type Title =
    | false
    | string
    | ({
      readonly text?: string;
    } & Text);

  /** Commit suggestion text styling options. */
  export type Text = {
    /** Optional ANSI foreground color. */
    readonly color?: t.AnsiColor.Name;
    /** Optional bold emphasis. */
    readonly bold?: boolean;
    /** Optional italic emphasis. */
    readonly italic?: boolean;
  };
}
