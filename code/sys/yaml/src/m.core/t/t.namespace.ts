import type * as Y from 'yaml';
import type { t } from '../common.ts';

/**
 * Public YAML type namespace.
 */
export namespace Yaml {
  // Errors:
  /** YAML parser or resolver error. */
  export type Error = t.YamlError;
  /** Normalized YAML diagnostic. */
  export type Diagnostic = t.YamlDiagnostic;

  // Env refs:
  /**
   * Pure YAML scalar environment-reference contracts.
   */
  export namespace EnvRef {
    /** AST scalar env-ref parser/resolver API. */
    export type Lib = t.YamlEnvRef.Lib;
    /** Env reference discovered in a scalar value. */
    export type Ref = t.YamlEnvRef.Ref;

    /**
     * Env-ref inspection contracts.
     */
    export namespace Inspect {
      /** Env-ref inspection result. */
      export type Result = t.YamlEnvRef.Inspect.Result;
    }

    /**
     * Env-ref resolution contracts.
     */
    export namespace Resolve {
      /** Env-ref resolver options. */
      export type Options = t.YamlEnvRef.Resolve.Options;
      /** Env-ref resolver result. */
      export type Result = t.YamlEnvRef.Resolve.Result;
    }
  }

  // Position:
  /** YAML source range in parser offsets. */
  export type Range = t.YamlRange;
  /** YAML line/column position. */
  export type LinePos = t.YamlLinePos;
  /** YAML line/column tuple. */
  export type LinePosTuple = t.YamlLinePosTuple;

  // Values:
  /** YAML AST node from the underlying parser. */
  export type Node = Y.Node;
  /** YAML key/value pair node. */
  export type Pair = Y.Pair;
  /** YAML scalar node. */
  export type Scalar = Y.Scalar;
  /** YAML mapping node. */
  export type Map = Y.YAMLMap<Y.Node, Y.Node>;
  /** YAML sequence node. */
  export type Seq = Y.YAMLSeq<Y.Node>;
  /** YAML alias node. */
  export type Alias = Y.Alias;

  // Ast:
  /** Parsed YAML AST document wrapper. */
  export type Ast = t.YamlAst;

  // Document:
  /** Underlying YAML document type. */
  export type Doc<Contents extends Y.Node = Y.Node, Strict extends boolean = true> = Y.Document<
    Contents,
    Strict
  >;
}
