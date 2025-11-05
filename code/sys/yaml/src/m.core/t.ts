import type * as Y from 'yaml';
import type { t } from './common.ts';

export type * from './t.Ast.ts';
export type * from './t.Diagnostic.ts';
export type * from './t.Is.ts';
export type * from './t.Path.ts';
export type * from './t.Range.ts';
export type * from './t.Syncer.ts';
export type * from './t.Value.ts';
export type * from './t.Yaml.lib.ts';

/**
 * Concise YAML type namespace.
 */
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

  // Ast:
  export type Ast = t.YamlAst;
}

/**
 * Error reported directly by the YAML parser.
 * - Low-level syntax/lexing/parsing issue (e.g. bad indentation, unclosed bracket).
 * - Includes message, source position, and optional `range` offsets.
 * - Occurs before any schema or semantic validation.
 */
export type YamlError = Y.YAMLError;

/** A single line/column position. */
export type YamlLinePos = { readonly line: number; readonly col: number };

/**
 * Line/column position tuple within the YAML source.
 *
 * Variants:
 * - `[start]` — a single caret position (zero-length range).
 * - `[start, end]` — a span between two positions (inclusive start, exclusive end).
 *
 * Each element is `{ line, col }`, using 1-based coordinates.
 * This form is often used by editors or LSP-style diagnostics.
 */
export type YamlLinePosTuple =
  | readonly [t.YamlLinePos] // ← single (caret only)
  | t.YamlLinePosPair; //       ← double

/**
 * Pair of line/column positions within the YAML source.
 *
 * Represents a definite span, with both start and end coordinates
 * (1-based line/column numbers). Commonly used for character range
 * conversions and editor selections.
 *
 * Example:
 * ```ts
 * const pair: YamlLinePosPair = [
 *   { line: 3, col: 5 },
 *   { line: 4, col: 12 },
 * ];
 * ```
 */
export type YamlLinePosPair = readonly [t.YamlLinePos, t.YamlLinePos];
