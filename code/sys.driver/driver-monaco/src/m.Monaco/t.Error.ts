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
