import { type t, Is } from './common.ts';

type E = t.EditorErrorLib;

/**
 * Convert a list of `YAMLError`s → `Diagnostic[]`.
 */
export const toDiagnosticsFromYaml: E['toDiagnosticsFromYaml'] = (list): t.Diagnostic[] => {
  return (list ?? []).map(toDiagnosticFromYaml);
};

/** Convert a single `YAMLError` → generic `Diagnostic`. */
export const toDiagnosticFromYaml: E['toDiagnosticFromYaml'] = (err): t.Diagnostic => {
  // 1) Prefer line/col if present.
  if (isLinePosPair(err.linePos)) {
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

  // 2) Fallback to byte offsets:
  if (isPosTuple(err.pos)) {
    const start = err.pos[0] ?? 0;
    const endRaw = err.pos[1];

    // Treat [0] or [0,0] as "no location" → message-only diagnostic.
    const hasMeaningfulPos = !(start === 0 && (endRaw === undefined || endRaw === 0));
    if (!hasMeaningfulPos) return { message: err.message, code: err.code };

    const end = endRaw ?? start + 1; // ensure non-zero width
    return { message: err.message, code: err.code, pos: [start, Math.max(end, start + 1)] };
  }

  // 3) Message-only:
  return { message: err.message, code: err.code };
};

/**
 * Helpers:
 */

/**
 * TODO 🐷
 * - move to MonacoIs
 * - rename to EditorIs
 */
function isPosTuple(x: unknown): x is readonly [number, number?] {
  return Array.isArray(x) && typeof x[0] === 'number';
}
function isLinePos(x: unknown): x is t.LinePos {
  return Is.record(x) && Is.number((x as t.LinePos).line) && Is.number((x as t.LinePos).col);
}
function isLinePosPair(x: unknown): x is readonly [t.LinePos, t.LinePos?] {
  if (!Array.isArray(x)) return false;
  return x.length >= 1 && isLinePos(x[0]) && (x[1] === undefined || isLinePos(x[1]));
}
