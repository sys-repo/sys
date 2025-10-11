import type { t } from '../common.ts';

/**
 * Map semantic validation errors → YAML diagnostics (message + path only).
 * Range enrichment happens upstream in the YAML layer.
 */
export function semanticErrorsToDiagnostics(
  errors: t.Schema.ValidationError[],
): t.Yaml.Diagnostic[] {
  return errors.map((e) => ({
    message: e.message,
    path: e.path,
  }));
}
