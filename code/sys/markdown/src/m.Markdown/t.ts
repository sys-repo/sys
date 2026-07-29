import type { Nodes as MdastNodes, Root as MdastRoot } from 'mdast';
import type { Position as UnistPosition } from 'unist';
import type { StdError, StringMarkdown } from '@sys/types';
import type { MarkdownFrontmatter } from '../m.Markdown.Frontmatter/t.ts';
import type { MarkdownHtml } from '../m.Markdown.Html/t.ts';

export type { MarkdownFrontmatter } from '../m.Markdown.Frontmatter/t.ts';
export type { MarkdownHtml } from '../m.Markdown.Html/t.ts';

/**
 * Markdown parsing, serialization, frontmatter, and safe rendering primitives.
 */
export declare namespace Markdown {
  /**
   * Core Markdown library surface.
   */
  export type Lib = {
    /** Parse Markdown text into the canonical MDAST document tree. */
    parse(src?: StringMarkdown, options?: ParseOptions): ParseResult;

    /** Serialize a canonical MDAST document tree back to Markdown text. */
    stringify(ast: Ast, options?: StringifyOptions): StringifyResult;

    /** Markdown frontmatter parsing. */
    readonly Frontmatter: Frontmatter.Lib;

    /** Safe Markdown → HTML rendering. */
    readonly Html: Html.Lib;

    /** Immutable source-text lenses over positioned Markdown nodes. */
    readonly Source: Source.Lib;

    /** Type guards for Markdown syntax-tree values. */
    readonly Is: IsLib;
  };

  /** Canonical Markdown syntax tree. */
  export type Ast = MdastRoot;

  /** Markdown input value: source text or an already parsed document tree. */
  export type Value = StringMarkdown | Ast;

  /** Markdown parse options. */
  export type ParseOptions = {
    /** Markdown flavor. Defaults to `gfm`. */
    readonly flavor?: Flavor;
  };

  /** Result of parsing Markdown text. */
  export type ParseResult = Ok<Ast> | Err;

  /** Markdown serialization options. */
  export type StringifyOptions = {
    /** Markdown flavor. Defaults to `gfm`. */
    readonly flavor?: Flavor;
  };

  /** Result of serializing Markdown text. */
  export type StringifyResult = Ok<StringMarkdown> | Err;

  /** Supported Markdown flavor policies. */
  export type Flavor = 'gfm' | 'commonmark';

  /** Any Markdown AST node. */
  export type Node = MdastNodes;

  /** Source position carried by syntax tree nodes. */
  export type Position = UnistPosition;

  /**
   * Type guards for Markdown syntax-tree values.
   */
  export type IsLib = {
    /** True when the input is an MDAST root node. */
    ast(input: unknown): input is Ast;
    /** True when the input is a structurally valid MDAST heading node. */
    heading(input: unknown): input is Extract<Node, { type: 'heading' }>;
    /** True when the input is a structurally valid MDAST inline-code node. */
    inlineCode(input: unknown): input is Extract<Node, { type: 'inlineCode' }>;
    /** True when the input is a structurally valid MDAST link node. */
    link(input: unknown): input is Extract<Node, { type: 'link' }>;
    /** True when the input is a GFM task-list item with concrete checked state. */
    taskListItem(
      input: unknown,
    ): input is Extract<Node, { type: 'listItem' }> & { readonly checked: boolean };
    /** True when the input is an MDAST thematic-break node. */
    thematicBreak(input: unknown): input is Extract<Node, { type: 'thematicBreak' }>;
  };

  /**
   * Immutable source-text lenses over positioned Markdown nodes.
   */
  export namespace Source {
    /**
     * Markdown source lens surface.
     */
    export type Lib = {
      /** Resolve the exact source span identified by a node's validated offsets. */
      slice(source: StringMarkdown, node: Node): string | undefined;

      /**
       * Resolve lexical facts for a positioned MDAST `thematicBreak` node.
       *
       * The parsed node remains grammar authority; this lens only recovers exact authored marker
       * facts.
       */
      thematicBreak(source: StringMarkdown, node: Node): ThematicBreakLexeme | undefined;
    };

    /** Exact lexical facts for a thematic break in its source document. */
    export type ThematicBreakLexeme = {
      /** Exact source span, including spaces between markers. */
      readonly raw: string;
      /** Repeated CommonMark thematic-break marker. */
      readonly marker: '-' | '*' | '_';
      /** Marker character count, excluding spaces and tabs. */
      readonly count: number;
      /** Whether a space or tab occurs between marker characters. */
      readonly spaced: boolean;
      /** Validated source position whose offsets identify `raw`. */
      readonly position: Position;
    };
  }

  /**
   * Markdown frontmatter parsing primitives.
   */
  export namespace Frontmatter {
    /** Markdown frontmatter parsing surface. */
    export type Lib = MarkdownFrontmatter.Lib;

    /** Parse options. */
    export type ParseOptions = MarkdownFrontmatter.ParseOptions;

    /** Parsed Markdown document with optional frontmatter. */
    export type Document<T = unknown> = MarkdownFrontmatter.Document<T>;

    /** Parsed YAML frontmatter block. */
    export type Block<T = unknown> = MarkdownFrontmatter.Block<T>;

    /** Result of parsing Markdown frontmatter. */
    export type ParseResult<T = unknown> = MarkdownFrontmatter.ParseResult<T>;
  }

  /**
   * Safe Markdown → HTML rendering primitives.
   */
  export namespace Html {
    /** Safe Markdown HTML rendering surface. */
    export type Lib = MarkdownHtml.Lib;

    /** Render input: raw Markdown source or a parsed MDAST document. */
    export type RenderInput = MarkdownHtml.RenderInput;

    /** Render options. */
    export type RenderOptions = MarkdownHtml.RenderOptions;

    /** Result of rendering Markdown to safe HTML. */
    export type RenderResult = MarkdownHtml.RenderResult;

    /** Sanitized HTML string. */
    export type StringHtml = MarkdownHtml.StringHtml;
  }

  /** Successful Markdown operation result. */
  export type Ok<T> = { readonly error?: undefined; readonly data: T };

  /** Failed Markdown operation result. */
  export type Err = { readonly error: StdError; readonly data?: undefined };
}
