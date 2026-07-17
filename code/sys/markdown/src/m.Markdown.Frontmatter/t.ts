import type * as Mdast from 'mdast';
import type { StdError, StringMarkdown, StringYaml } from '@sys/types';

/**
 * Markdown frontmatter parsing primitives.
 */
export declare namespace MarkdownFrontmatter {
  /** Markdown frontmatter parsing surface. */
  export type Lib = {
    /** Parse optional YAML frontmatter, stripped Markdown body, and body MDAST. */
    parse<T = unknown>(src?: StringMarkdown, options?: ParseOptions): ParseResult<T>;
  };

  /** Parse options. */
  export type ParseOptions = {
    /** Markdown flavor used for the body parse. Defaults to `gfm`. */
    readonly flavor?: Flavor;
  };

  /** Supported Markdown flavor policies. */
  export type Flavor = 'gfm' | 'commonmark';

  /** Parsed Markdown document with optional frontmatter. */
  export type Document<T = unknown> = {
    /** Parsed YAML frontmatter when present. */
    readonly frontmatter?: Block<T>;

    /** Markdown body with the frontmatter block removed. */
    readonly markdown: StringMarkdown;

    /** Parsed MDAST root for `markdown`. */
    readonly ast: Mdast.Root;
  };

  /** Parsed YAML frontmatter block. */
  export type Block<T = unknown> = {
    /** Frontmatter serialization format. */
    readonly format: 'yaml';

    /** Raw YAML content without opening or closing fences. */
    readonly raw: StringYaml;

    /** YAML parsed through `@sys/yaml`. */
    readonly data: T | null;
  };

  /** Result of parsing Markdown frontmatter. */
  export type ParseResult<T = unknown> = Ok<Document<T>> | Err;

  /** Successful Markdown frontmatter operation result. */
  export type Ok<T> = { readonly error?: undefined; readonly data: T };

  /** Failed Markdown frontmatter operation result. */
  export type Err = { readonly error: StdError; readonly data?: undefined };
}
