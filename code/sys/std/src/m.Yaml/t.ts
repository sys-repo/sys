import type * as Y from 'yaml';
import type { t } from './common.ts';

export type * from './t.Diagnostic.ts';
export type * from './t.Is.ts';
export type * from './t.Path.ts';
export type * from './t.Syncer.ts';
export type * from './t.Value.ts';

/** A single line/column position. */
export type LinePos = { readonly line: number; readonly col: number };

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
 * Character offset range within the YAML source.
 * - `[start, end)` — normalized editor/diagnostic span.
 * - `[start, valueEnd, nodeEnd]` — full YAML AST span.
 */
export type YamlRange = readonly [number, number] | readonly [number, number, number];

/**
 * Helpers for working with YAML.
 */
export type YamlLib = {
  /** YAML flag helpers. */
  readonly Is: t.YamlIsLib;
  /** Helpers for normalizing YAML parser errors into standard diagnostics. */
  readonly Diagnostic: t.YamlDiagnosticLib;

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

/** Response from the `Yaml.parse` method. */
export type YamlParseResponse<T> = {
  readonly data?: T;
  readonly error?: t.StdError;
};
