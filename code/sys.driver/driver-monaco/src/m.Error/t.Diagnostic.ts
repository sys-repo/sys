import type { t } from './common.ts';

/** Diagnostic severity, matching Monaco.MarkerSeverity keys. */
export type DiagnosticSeverity = 'Error' | 'Warning' | 'Info' | 'Hint';

/**  */
export type DiagnosticSeverityConst = Record<NonNullable<DiagnosticSeverity>, number>;

/**
 * Generic diagnostic marker:
 * Represents a unified error or warning within a text document.
 *
 * Used as the cross-format carrier between schema/YAML diagnostics and
 * Monaco’s `IMarkerData` (via `Error.toMarkers`).
 *
 * Supports multiple coordinate systems:
 *  - `range`: raw byte/character offsets (typical from YAML parsers)
 *  - `pos`: simpler start/end offsets (as in LSP diagnostics)
 *  - `linePos`: 1-based line/column pairs (human-readable, language-agnostic)
 */
export type Diagnostic = {
  /** The human-readable description of the problem. */
  readonly message: string;

  /**
   * Optional machine-readable error identifier.
   * May be numeric or string, depending on the source (e.g. YAML code, schema rule ID).
   */
  readonly code?: string | number;

  /**
   * Byte-offset positions within the text buffer.
   * Usually provided by low-level parsers (e.g. YAML AST).
   *
   * `[start, end]`
   * - Both are 0-based indices.
   * - `end` is exclusive.
   */
  readonly pos?: readonly [number, number];

  /**
   * Document range using the YAML parser convention:
   * `[start, valueEnd, nodeEnd?]`
   *
   * This may include up to three offsets (start → end of node span).
   * When present, this takes precedence over `pos` or `linePos`.
   */
  readonly range?: readonly [number, number, number?];

  /**
   * Explicit line/column positions (1-based).
   *
   * `[start, end]`
   * - Each item contains `{ line, col }`
   * - Used when diagnostics are reported in human-oriented coordinates.
   */
  readonly linePos?: readonly [t.LinePos, t.LinePos];

  /**
   * Optional logical object path within the YAML or schema document.
   * Used for linking back to a structured data node (e.g. `["spec", "ports", 0]`).
   */
  readonly path?: t.ObjectPath;

  /**
   * Severity level, normalized to Monaco’s four standard kinds.
   * Defaults to `"Error"` when omitted.
   */
  readonly severity?: 'Error' | 'Warning' | 'Info' | 'Hint';
};
