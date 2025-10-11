// src/catalog.edu/m.slug/schema.validation/u.toEditorDiagnostics.ts
import type { t } from '../common.ts';

/**
 * Map semantic validation errors → editor diagnostics (with severity).
 * Default severity: 'Error' (Monaco semantics).
 */
export function semanticErrorsToEditorDiagnostics(
  errors: t.Schema.ValidationError[],
  opts?: { severity?: t.DiagnosticSeverity },
): t.EditorDiagnostic[] {
  const severity = opts?.severity ?? 'Error';
  return errors.map((e) => ({
    message: e.message,
    path: e.path,
    severity,
  }));
}
