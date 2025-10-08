import type { t } from './common.ts';

/**
 * Convert schema/YAML diagnostics into Monaco editor markers.
 */
export type EditorErrorLib = {
  /**
   * Map `Schema.Error` diagnostics to Monaco `IMarkerData`.
   * - Skips diagnostics without a `range` (no position info).
   * - Converts byte offsets to Monaco’s 1-based line/column via the model.
   *
   * @param target Monaco text model or editor (used to resolve positions).
   * @param errors Unified diagnostics (`schema` | `semantic` | `yaml`).
   * @returns Readonly list of markers for `monaco.editor.setModelMarkers`.
   */
  toMarkers(
    target: t.Monaco.TextModel | t.Monaco.Editor,
    errors: t.Diagnostic[],
  ): t.Monaco.I.IMarkerData[];

  /** Sync Monaco's visible error diagnostics. */
  useErrorMarkers: t.UseErrorMarkers;
};

/** A single line/column position. */
export type LinePos = Readonly<{ line: number; col: number }>;

/**
 * Generic diagnostic marker:
 * message, code, and any of the position types supported by Monaco.
 */
export type Diagnostic = Readonly<{
  message: string;
  code?: string | number;

  /** byte offsets within the text buffer */
  pos?: [number, number];
  /** YAML/document range [start, valueEnd, nodeEnd?] */
  range?: [number, number, number?];
  /** line/column positions */
  linePos?: [LinePos, LinePos];

  /** Optional logical object path (for upstream linking) */
  path?: t.ObjectPath;

  /** Diagnostic severity. */
  severity?: DiagnosticSeverity;
}>;

/** Diagnostic severity, matching Monaco.MarkerSeverity keys. */
export type DiagnosticSeverity = 'Error' | 'Warning' | 'Info' | 'Hint';

/**  */
export type DiagnosticSeverityConst = Record<NonNullable<DiagnosticSeverity>, number>;
