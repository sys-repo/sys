import type * as Y from 'yaml';
import type { t } from './common.ts';

export type * from './t.Path.ts';
export type * from './t.Syncer.ts';
export type * from './t.Value.ts';

/**
 * Concise YAML type namespace.
 */
export namespace Yaml {
  export type Ast = t.YamlAst;
  export type Range = t.YamlRange;
  // Errors:
  export type Error = t.YamlError;
  export type Diagnostic = t.YamlDiagnostic;
  // Values:
  export type Node = Y.Node;
  export type Pair = Y.Pair;
  export type Scalar = Y.Scalar;
}

/**
 * Error reported directly by the YAML parser.
 * - Low-level syntax/lexing/parsing issue (e.g. bad indentation, unclosed bracket).
 * - Includes message, source position, and optional `range` offsets.
 * - Occurs before any schema or semantic validation.
 */
export type YamlError = Y.YAMLError;

/**
 * Character offset range into the source YAML.
 * - [start, valueEnd, nodeEnd]
 */
export type YamlRange = Y.Range;

/**
 * Helpers for working with YAML.
 */
export type YamlLib = {
  /** YAML flag helpers. */
  readonly Is: YamlIsLib;

  /** Parse YAML to a plain JS value (fast). */
  parse<T>(input?: t.StringYaml): YamlParseResponse<T>;

  /** Parse YAML and keep the full `Document` (ranges, comments, errors). */
  parseAst(src: t.StringYaml): t.YamlAst;

  /** Creates a new parse-syncer. */
  readonly Syncer: t.YamlSyncLib;
  readonly syncer: t.YamlSyncLib['make'];

  /** YAML path helpers. */
  readonly Path: t.YamlPathLib;
  readonly path: t.YamlPathLib['make'];
};

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
};

/** Response from the `Yaml.parse` method. */
export type YamlParseResponse<T> = {
  readonly data?: T;
  readonly error?: t.StdError;
};

/**
 * Normalized YAML diagnostic.
 * - Unified representation for all YAML issues:
 *   - parser (syntax),
 *   - schema (structural),
 *   - semantic (logical).
 * - Portable across tools (Monaco, LSP, CLI).
 * - Suitable for visual markers, logs, and validation pipelines.
 */
export type YamlDiagnostic = {
  /** Human-readable description of the issue. */
  readonly message: string;

  /** Optional machine code or rule ID (e.g. 'slug/schema', 'slug/alias-duplicate'). */
  readonly code?: string;

  /**
   * Object path to the offending node (relative to YAML document root).
   * Used for correlating errors with schema fields or semantic locations.
   */
  readonly path?: t.ObjectPath;

  /**
   * Character range [start, end) within the YAML source.
   * Enables precise editor markers or highlighting.
   */
  readonly range?: Yaml.Range;
};
