import type { codeToTokens } from 'shiki';
import type { CliFormat } from '../m.Fmt/t.ts';

type WithDefaultTheme<T> = T extends { readonly theme: infer TTheme }
  ? Omit<T, 'theme'> & { readonly theme?: TTheme }
  : T;

/**
 * Contracts for plain and syntax-highlighted terminal code blocks.
 */
export declare namespace CliFormatCode {
  /**
   * Formats code as terminal display blocks.
   */
  export type Lib = {
    /** Format a terminal code snippet as an indented text block. */
    block(text: string, options?: Block.Options): string;
    /** Format a terminal code snippet with Shiki-backed ANSI syntax highlighting. */
    highlight(text: string, options: Highlight.Options): Promise<string>;
  };

  /**
   * Extension of the base formatter with the code-block library.
   */
  export namespace Fmt {
    /**
     * Preserves the complete base formatter and adds `Code`.
     */
    export type Lib = CliFormat.Lib & {
      /** Code block formatting helpers. */
      readonly Code: CliFormatCode.Lib;
    };
  }

  /** Shared code block layout options. */
  export type LayoutOptions = {
    /** Number of spaces to prefix to non-empty rendered lines. */
    readonly indent?: number;
    /** Include Markdown-style code fences around the rendered block. */
    readonly fence?: boolean;
  };

  /** Whole-block color treatment. */
  export type Tone = 'default' | 'muted';

  /**
   * Options owned by plain code-block formatting.
   */
  export namespace Block {
    /** Code block formatting options. */
    export type Options = LayoutOptions & {
      /** Optional language tag used when rendering a fenced block. */
      readonly lang?: string;
      /** Optional whole-block color treatment. */
      readonly tone?: Tone;
    };
  }

  /**
   * Options owned by Shiki-backed syntax highlighting.
   */
  export namespace Highlight {
    /** Shiki-backed syntax highlighting options. */
    export type Options = LayoutOptions & ShikiOptionsWithDefaultTheme;

    /** Options accepted by Shiki's code tokenizer. */
    export type ShikiOptions = NonNullable<Parameters<typeof codeToTokens>[1]>;

    /** Shiki tokenizer options with the single-theme field made optional. */
    export type ShikiOptionsWithDefaultTheme = WithDefaultTheme<ShikiOptions>;
  }
}
