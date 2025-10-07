import { useErrorMarkers } from '../m.Markers.Error/mod.ts';
import type { t } from './common.ts';

type D = t.Diagnostic;

/**
 * YAML-specialized wrapper: normalize YAMLError → Diagnostic
 * then delegate to the generic useErrorMarkers.
 */
export const useYamlErrorMarkers: t.UseYamlErrorMarkers = (args) => {
  const { errors, ...rest } = args;
  const normalized = (errors ?? []).map(toDiagnosticFromYaml);
  return useErrorMarkers({ ...rest, errors: normalized });
};

/**
 * Helpers:
 */
function toDiagnosticFromYaml(e: t.YamlError): D {
  // Prefer line/col if present.
  if (Array.isArray(e.linePos) && e.linePos.length >= 1) {
    const start = e.linePos[0]!;
    const end = e.linePos[1] ?? e.linePos[0]; // normalize 1-tuple → 2-tuple (zero-length range)
    return {
      message: e.message,
      code: e.code,
      linePos: [
        { line: start.line, col: start.col },
        { line: end.line, col: end.col },
      ],
    };
  }

  // Fallback to character offsets if available.
  if (e.pos && e.pos[0] !== undefined) {
    return {
      message: e.message,
      code: e.code,
      pos: [e.pos[0], e.pos[1]],
    };
  }

  // Last-ditch: message only (top-left default will be used by renderer).
  return {
    message: e.message,
    code: e.code,
  };
}
