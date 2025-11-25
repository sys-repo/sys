import type { t } from './common.ts';

/**
 * Boolean evaluators for YAML entities.
 * - Centralized type guards for parser-level and normalized structures.
 */
export type YamlIsLib = {
  /**
   * True iff the input represents a YAML parse error:
   *  - native `YAMLError` instance, or
   *  - `Err.std` with `name`/`cause === ERR.PARSE`, or
   *  - structurally parser-like with a valid `pos: [start,end]`.
   */
  parseError(input?: unknown): input is t.YamlError;

  /**
   * Strict structural check for `[start,end]` parser-style positions.
   */
  posTuple(pos?: unknown): pos is [number, number];

  /**
   * True if the given value is a normalized YAML diagnostic.
   * - Used for schema, semantic, or parser-normalized errors.
   */
  diagnostic(input?: unknown): input is t.YamlDiagnostic;
  /** Array variants for convenience. */
  parseErrorArray(input?: unknown): input is t.YamlError[];
  diagnosticArray(input?: unknown): input is t.YamlDiagnostic[];

  /**
   * True if the node is a YAML Scalar in the AST.
   */
  scalar(input?: unknown): input is t.Yaml.Scalar;

  /**
   * True if the node is a YAML mapping (Map) in the AST.
   */
  map(input?: unknown): input is t.Yaml.Node;

  /**
   * True if the node is a YAML sequence (Seq) in the AST.
   */
  seq(input?: unknown): input is t.Yaml.Node;

  /**
   * True if the node is a YAML pair (key/value entry) in the AST.
   */
  pair(input?: unknown): input is t.Yaml.Pair;

  /**
   * True if the node is a YAML alias node in the AST.
   */
  alias(input?: unknown): input is t.Yaml.Node;
};
