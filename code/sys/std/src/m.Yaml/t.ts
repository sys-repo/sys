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
  export type Error = t.YamlError;
  export type Range = t.YamlRange;
  export type Diagnostic = t.YamlDiagnostic;
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
 * YAML related flags.
 */
export type YamlIsLib = {
  /** Determine if the given value is a YAML parse error object. */
  parseError(input?: unknown): boolean;
};

/** Response from the `Yaml.parse` method. */
export type YamlParseResponse<T> = {
  readonly data?: T;
  readonly error?: t.StdError;
};

/**
 * Normalized YAML diagnostic.
 * - Used for parser, schema, or semantic errors.
 * - Portable across drivers (e.g., Monaco, LSP, CLI).
 */
export type YamlDiagnostic = {
  readonly message: string;
  readonly code?: string;
  readonly path?: t.ObjectPath;
  readonly range?: Yaml.Range;
};
