import type { codeToTokens } from 'shiki';
import type { CliFormat } from '../m.Fmt/t.ts';

export type ShikiCodeToTokensOptions = NonNullable<Parameters<typeof codeToTokens>[1]>;
type WithDefaultTheme<T> = T extends { readonly theme: infer TTheme }
  ? Omit<T, 'theme'> & { readonly theme?: TTheme }
  : T;
export type ShikiCodeToTokensOptionsWithDefaultTheme = WithDefaultTheme<ShikiCodeToTokensOptions>;

/**
 * Code block formatting helper types.
 */
export declare namespace CliFormatCode {
  /** Code block formatting helpers. */
  export type Lib = {
    /** Format a terminal code snippet as an indented text block. */
    block(text: string, options?: BlockOptions): string;
    /** Format a terminal code snippet with Shiki-backed ANSI syntax highlighting. */
    highlight(text: string, options: HighlightOptions): Promise<string>;
  };

  /** Base formatter extension surface that adds code formatting helpers. */
  export namespace Fmt {
    /** Formatting helper library extended with code block formatting. */
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

  /** Code block formatting options. */
  export type BlockOptions = LayoutOptions & {
    /** Optional language tag used when rendering a fenced block. */
    readonly lang?: string;
    /** Optional whole-block color treatment. */
    readonly tone?: Tone;
  };

  /** Shiki-backed syntax highlighting options. */
  export type HighlightOptions = LayoutOptions & ShikiCodeToTokensOptionsWithDefaultTheme;

  /** Whole-block color treatment. */
  export type Tone = 'default' | 'muted';
}
