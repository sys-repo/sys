import type * as Mdast from 'mdast';
import type { StdError, StringMarkdown } from '@sys/types';

/**
 * Safe Markdown → HTML rendering primitives.
 */
export declare namespace MarkdownHtml {
  /** Safe Markdown HTML rendering surface. */
  export type Lib = {
    /** Render Markdown source or an MDAST root to sanitized HTML. */
    render(input?: RenderInput, options?: RenderOptions): RenderResult;
  };

  /** Canonical Markdown syntax tree accepted by the renderer. */
  export type Ast = Mdast.Root;

  /** Render input: raw Markdown source or a parsed MDAST document. */
  export type RenderInput = StringMarkdown | Ast;

  /** Render options. */
  export type RenderOptions = {
    /** Markdown flavor used when the input is raw Markdown text. Defaults to `gfm`. */
    readonly flavor?: Flavor;
  };

  /** Supported Markdown flavor policies. */
  export type Flavor = 'gfm' | 'commonmark';

  /** Result of rendering Markdown to safe HTML. */
  export type RenderResult = Ok<StringHtml> | Err;

  /** Sanitized HTML string. */
  export type StringHtml = string;

  /** Successful Markdown HTML render result. */
  export type Ok<T> = { readonly error?: undefined; readonly data: T };

  /** Failed Markdown HTML render result. */
  export type Err = { readonly error: StdError; readonly data?: undefined };
}
