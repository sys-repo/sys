/**
 * Contracts for composing terminal keyboard-hint presentation.
 */
export declare namespace CliFormatKeyboard {
  /**
   * Formats keyboard commands and terminal-width rows.
   */
  export type Lib = {
    /** Format one authored command label, ordered keys, and optional context. */
    readonly command: (options: Command.Options) => string;
    /** Select and align the first complete candidate that fits an explicit terminal width. */
    readonly row: (options: Row.Options) => string | undefined;
  };

  /**
   * Input for formatting one keyboard command.
   */
  export namespace Command {
    /** Package-authored, non-empty, single-line command display text. */
    export type Options = {
      /** Non-empty single-line action label without its trailing colon. */
      label: string;
      /** Non-empty ordered single-line key strings. */
      keys: [first: string, ...rest: string[]];
      /** Optional single-line context without parentheses. */
      context?: string;
    };
  }

  /**
   * Input for choosing and aligning one complete keyboard row.
   */
  export namespace Row {
    /** Explicit terminal width and ordered complete presentation candidates. */
    export type Options = {
      width: number;
      candidates: Candidate[];
    };

    /** One complete keyboard-row presentation candidate. */
    export type Candidate = {
      /** Required non-empty single-line right-aligned command lane; ANSI bytes are preserved. */
      right: string;
      /** Optional non-empty single-line left-aligned command lane; ANSI bytes are preserved. */
      left?: string;
    };
  }
}
