import type { t } from '../common.ts';

type L = t.SlugValidationLib;

/**
 * Map semantic validation errors → YAML diagnostics (message + path only).
 * Range enrichment happens upstream in the YAML layer.
 */
export const semanticErrorsToDiagnostics: L['semanticErrorsToDiagnostics'] = (
  errors: t.Schema.ValidationError[],
) => {
  return errors.map((e) => ({ message: e.message, path: e.path }));
};

/**
 * Map semantic validation errors → editor diagnostics (with severity).
 * Default severity: 'Error' (Monaco semantics).
 */
export const semanticErrorsToEditorDiagnostics: L['semanticErrorsToEditorDiagnostics'] = (
  errors: t.Schema.ValidationError[],
  opts?: { severity?: t.DiagnosticSeverity },
) => {
  const severity = opts?.severity ?? 'Error';
  return errors.map((e) => ({ message: e.message, path: e.path, severity }));
};
