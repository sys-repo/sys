import { useErrorMarkers } from '../m.Markers.Error/mod.ts';
import { type t, slug } from './common.ts';

type D = t.Diagnostic;

/**
 * YAML-specialized wrapper: convert YAMLError → Diagnostic,
 * then delegate to the generic error-marker hook.
 */
export const useYamlErrorMarkers: t.UseYamlErrorMarkers = (args) => {
  const { errors, ...rest } = args;
  const owner = args.owner ?? `yaml-${slug()}`;
  const normalized: D[] = (errors ?? []).map(toDiagnosticFromYaml);
  return useErrorMarkers({ ...rest, owner, errors: normalized });
};

/**
 * Helpers:
 */
function toDiagnosticFromYaml(e: t.YamlError): D {
  // Prefer line/col if present.
  if (Array.isArray(e.linePos) && e.linePos.length >= 1) {
    const lp = e.linePos;
    const start = lp[0]!;
    const endRaw = lp[1] ?? lp[0]; // single-tuple → same as start

    // NB: ensure non-zero length (nudge end by 1 col if identical)
    const end =
      endRaw.line === start.line && endRaw.col === start.col
        ? { line: endRaw.line, col: endRaw.col + 1 }
        : endRaw;

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
  if (Array.isArray(e.pos) && e.pos.length >= 1) {
    const p = e.pos as [number, number?];
    const start = p[0] ?? 0;
    const end = p[1] ?? start + 1; // ensure non-zero length.
    return {
      message: e.message,
      code: e.code,
      pos: [start, end],
    };
  }

  // Last-ditch: message only; projector will default to (1,1)-(1,1).
  return {
    message: e.message,
    code: e.code,
  };
}
