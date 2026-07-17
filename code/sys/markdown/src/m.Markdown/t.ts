import type * as Mdast from 'mdast';
import type * as Unist from 'unist';
import type { StdError, StringMarkdown } from '@sys/types';

/**
 * Markdown parsing and serialization primitives.
 */
export declare namespace Markdown {
  /** Core Markdown library surface. */
  export type Lib = {
    /** Parse Markdown text into the canonical MDAST document tree. */
    parse(src?: StringMarkdown, options?: ParseOptions): ParseResult;

    /** Serialize a canonical MDAST document tree back to Markdown text. */
    stringify(ast: Ast, options?: StringifyOptions): StringifyResult;

    /** Type guards for Markdown syntax-tree values. */
    readonly Is: IsLib;
  };

  /** Canonical Markdown syntax tree. */
  export type Ast = Mdast.Root;

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
  export type Node = Mdast.Nodes;

  /** Source position carried by syntax tree nodes. */
  export type Position = Unist.Position;

  /** Type guards for Markdown syntax-tree values. */
  export type IsLib = {
    /** True when the input is an MDAST root node. */
    ast(input: unknown): input is Ast;
  };

  /** Successful Markdown operation result. */
  export type Ok<T> = { readonly error?: undefined; readonly data: T };

  /** Failed Markdown operation result. */
  export type Err = { readonly error: StdError; readonly data?: undefined };
}
