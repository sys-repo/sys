import type { t } from '../common.ts';

/**
 * Code block formatting helper types.
 */
export declare namespace CliFormatCode {
  /** Code block formatting helpers. */
  export type Lib = {
    /** Format a terminal code snippet as an indented text block. */
    block(text: string, options?: BlockOptions): string;
  };

  /** Base formatter extension surface that adds code formatting helpers. */
  export namespace Fmt {
    /** Formatting helper library extended with code block formatting. */
    export type Lib = t.CliFormat.Lib & {
      /** Code block formatting helpers. */
      readonly Code: CliFormatCode.Lib;
    };
  }

  /** Code block formatting options. */
  export type BlockOptions = {
    /** Optional language tag used when rendering a fenced block. */
    readonly lang?: string;
    /** Number of spaces to prefix to non-empty rendered lines. */
    readonly indent?: number;
    /** Include Markdown-style code fences around the rendered block. */
    readonly fence?: boolean;
    /** Optional whole-block color treatment. */
    readonly tone?: Tone;
  };

  /** Whole-block color treatment. */
  export type Tone = 'default' | 'muted';
}
