import type * as Y from 'yaml';
import type { t } from './common.ts';

export namespace Yaml {
  // Errors:
  export type Error = t.YamlError;
  export type Diagnostic = t.YamlDiagnostic;

  // Position:
  export type Range = t.YamlRange;
  export type LinePos = t.YamlLinePos;
  export type LinePosTuple = t.YamlLinePosTuple;

  // Values:
  export type Node = Y.Node;
  export type Pair = Y.Pair;
  export type Scalar = Y.Scalar;
  export type Map = Y.YAMLMap<Y.Node, Y.Node>;
  export type Seq = Y.YAMLSeq<Y.Node>;
  export type Alias = Y.Alias;

  // Ast:
  export type Ast = t.YamlAst;

  // Document:
  export type Doc<Contents extends Y.Node = Y.Node, Strict extends boolean = true> = Y.Document<
    Contents,
    Strict
  >;
}
