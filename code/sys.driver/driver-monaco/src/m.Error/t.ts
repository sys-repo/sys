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
   * @returns list of markers for `monaco.editor.setModelMarkers`.
   */
  toMarkers(
    target: t.Monaco.TextModel | t.Monaco.Editor,
    errors: t.EditorDiagnostic[],
  ): t.Monaco.I.IMarkerData[];

  /** Convert a single `YAMLError` → generic `Diagnostic`. */
  toDiagnosticFromYaml(e: t.YamlError): t.EditorDiagnostic;

  /** Convert a list of `YAMLError`s → `Diagnostic[]`. */
  toDiagnosticsFromYaml(list?: t.YamlError[]): t.EditorDiagnostic[];

  /** Sync Monaco's visible error diagnostics. */
  useErrorMarkers: t.UseErrorMarkers;
};

/** Diagnostic severity, matching Monaco.MarkerSeverity keys. */
export type DiagnosticSeverity = 'Error' | 'Warning' | 'Info' | 'Hint';

/** An object representation of the severity levels. */
export type DiagnosticSeverityConst = Record<NonNullable<DiagnosticSeverity>, number>;

/**
 * Normalized diagnostic shape used by editor and driver layers.
 * Derived from YAML or schema diagnostics, but tailored for
 * Monaco marker projection.
 */
export type EditorDiagnostic = {
  /** Human-readable problem description. */
  readonly message: string;

  /** Optional machine-readable error identifier (string or number). */
  readonly code?: string | number;

  /** Byte-offset positions within the source text. `[start, end)` */
  readonly pos?: readonly [number, number];

  /**
   * Parser-style range `[start, valueEnd, nodeEnd?]`.
   * Takes precedence over `pos` or `linePos`.
   */
  readonly range?: readonly [number, number, number?];

  /**
   * Line/column coordinates (1-based).
   * `[start, end]` — each `{ line, col }`.
   */
  readonly linePos?: readonly [t.LinePos, t.LinePos];

  /** Object path within document (e.g. `["spec", "ports", 0]`). */
  readonly path?: t.ObjectPath;

  /** Severity normalized to Monaco’s four standard levels. */
  readonly severity?: t.DiagnosticSeverity;
};
