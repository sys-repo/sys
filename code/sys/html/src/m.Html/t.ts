import type {
  DefaultTreeAdapterMap,
  DefaultTreeAdapterTypes as Tree,
  ParserError,
  ParserErrorHandler,
  ParserOptions,
  Token,
} from 'parse5';

/**
 * HTML parsing with parse5's default tree representation.
 * Trees are mutable caller-owned data, not browser DOM nodes or sanitized HTML.
 */
export declare namespace Html {
  /** Synchronous parsing and default-tree narrowing. */
  export type Lib = {
    /** Parse a document, recovering malformed markup and synthesizing implied elements. */
    parse(source: string, options?: ParseOptions): Document;
    /** Parse a fragment, optionally in an explicit parent context. */
    readonly parseFragment: ParseFragment;
    /** Guards for trusted default-tree nodes, not validators for arbitrary values. */
    readonly Is: IsLib;
  };

  /** Recovered document, not a browser DOM Document. */
  export type Document = Tree.Document;
  /** Fragment whose source positions address only the supplied fragment string. */
  export type DocumentFragment = Tree.DocumentFragment;
  /** Any default-tree node. */
  export type Node = Tree.Node;
  /** A node that can own children or provide a fragment context. */
  export type ParentNode = Tree.ParentNode;
  /** A child in a default-tree document or fragment. */
  export type ChildNode = Tree.ChildNode;
  /** Element with decoded attributes and its original namespace. */
  export type Element = Tree.Element;
  /** HTML template; descendants live in `content`, not `childNodes`. */
  export type Template = Tree.Template;

  /**
   * All upstream options, specialized to the default-tree shape.
   * `scriptingEnabled` defaults true, parsing `<noscript>` contents as text; false permits markup
   * parsing inside `<noscript>`. Scripts never execute. Source locations default false. A non-null
   * error callback enables locations even when explicitly disabled. Callback exceptions propagate
   * unchanged.
   * Custom adapters must preserve the default-tree contract and own their allocation/effects.
   */
  export type ParseOptions = ParserOptions<DefaultTreeAdapterMap>;

  /**
   * Omitted or null context uses upstream's synthetic HTML template context. Supply a context when
   * parsing rules depend on the containing element: table context can introduce `tbody`, while
   * textarea context treats markup as text. With the default adapter, parsing returns a separate
   * fragment without modifying the context or appending children to it.
   */
  export type ParseFragment = {
    (source: string, options?: ParseOptions): DocumentFragment;
    /** The context form requires options; pass `{}` for upstream defaults. */
    (context: ParentNode | null, source: string, options: ParseOptions): DocumentFragment;
  };

  /** Narrow parser-shaped nodes, including absent children. */
  export type IsLib = {
    /** Narrow an element in any namespace. */
    element(node: Node | null | undefined): node is Element;
    /** Narrow an HTML-namespace template with its separate content fragment. */
    template(node: Node | null | undefined): node is Template;
  };

  /** Decoded attribute value with upstream name, namespace and prefix identity. */
  export type Attribute = Token.Attribute;
  /**
   * Original-source span: zero-based UTF-16 offsets, exclusive end, one-based line/column.
   * Node locations may be absent or null; mutating a tree does not update source positions.
   */
  export type Location = Token.Location;
  /** Element span with optional attribute and tag spans; implied elements may have none. */
  export type ElementLocation = Token.ElementLocation;
  /** Upstream diagnostic code and coordinates, including possible -1 fallback positions. */
  export type ParseError = ParserError;
  /** Upstream diagnostic callback; no implicit collector or error wrapper is installed. */
  export type ParseErrorHandler = ParserErrorHandler;
}
