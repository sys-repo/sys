import type * as TXml from '@std/xml';
import type { t } from './common.ts';

/**
 * XML parsing facade contracts.
 */
export declare namespace Xml {
  /** Minimal XML facade surface owned by `@sys/std/xml`. */
  export type Lib = {
    /** Parse XML into a document result without throwing through callers. */
    readonly parse: (text: string, options?: ParseOptions) => ParseResult;
    /** XML node type guards. */
    readonly Is: Is.Lib;
  };

  /** XML parser options exposed by the facade. */
  export type ParseOptions = Omit<TXml.ParseOptions, 'disallowDoctype'>;

  /** Data-first XML parse result. */
  export type ParseResult =
    | { readonly ok: true; readonly doc: Document }
    | { readonly ok: false; readonly error: t.StdError };

  /** Parsed XML document. */
  export type Document = TXml.XmlDocument;
  /** XML element node. */
  export type Element = TXml.XmlElement;
  /** XML document-tree node. */
  export type Node = TXml.XmlNode;
  /** XML text node. */
  export type TextNode = TXml.XmlTextNode;
  /** XML CDATA node. */
  export type CDataNode = TXml.XmlCDataNode;

  /**
   * XML node guard contracts.
   */
  export namespace Is {
    /** Type guards for XML document-tree nodes. */
    export type Lib = {
      /** True when the node is an XML element. */
      readonly element: (node: Node) => node is Element;
      /** True when the node is an XML text node. */
      readonly text: (node: Node) => node is TextNode;
      /** True when the node is an XML CDATA node. */
      readonly cdata: (node: Node) => node is CDataNode;
    };
  }
}
