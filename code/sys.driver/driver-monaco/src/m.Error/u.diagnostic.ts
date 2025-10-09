import { type t, EditorIs } from './common.ts';

type E = t.EditorErrorLib;

/**
 * Convert a list of `YAMLError`s → `Diagnostic[]`.
 */
export const toDiagnosticsFromYaml: E['toDiagnosticsFromYaml'] = (list): t.EditorDiagnostic[] => {
  return (list ?? []).map(toDiagnosticFromYaml);
};

/** Convert a single `YAMLError` → generic `Diagnostic`. */
export const toDiagnosticFromYaml: E['toDiagnosticFromYaml'] = (err): t.EditorDiagnostic => {
  // Prefer line/col if present.
  if (EditorIs.linePosPair(err.linePos)) {
    const start = err.linePos[0]!;
    const endRaw = err.linePos[1] ?? start;

    // Ensure non-zero width
    const end: t.LinePos =
      endRaw.line === start.line && endRaw.col === start.col
        ? { line: endRaw.line, col: endRaw.col + 1 }
        : endRaw;

    return {
      message: err.message,
      code: err.code,
      linePos: [
        { line: start.line, col: start.col },
        { line: end.line, col: end.col },
      ],
    };
  }

  // Fallback to byte offsets:
  if (EditorIs.posTuple(err.pos)) {
    const start = err.pos[0] ?? 0;
    const endRaw = err.pos[1];

    // Treat [0] or [0,0] as "no location" → message-only diagnostic.
    const hasMeaningfulPos = !(start === 0 && (endRaw === undefined || endRaw === 0));
    if (!hasMeaningfulPos) return { message: err.message, code: err.code };

    const end = endRaw ?? start + 1; // ensure non-zero width
    return { message: err.message, code: err.code, pos: [start, Math.max(end, start + 1)] };
  }

  // Message-only:
  return {
    message: err.message,
    code: err.code,
  };
};
