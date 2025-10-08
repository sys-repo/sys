import { type t, Num, Severity } from './common.ts';

export const toMarkers: t.EditorErrorLib['toMarkers'] = (target, errors) => {
  const model = 'getModel' in target ? target.getModel() : target;
  if (!model) return [];

  const offsetFromLineCol = (line: number, col: number): number => {
    const lineCount = model.getLineCount?.() ?? 1;
    const ln = Num.clamp(1, lineCount, line);
    let off = 0;
    for (let i = 1; i < ln; i++) {
      const text = model.getLineContent?.(i) ?? '';
      off += text.length + 1; // assume '\n'
    }
    const text = model.getLineContent?.(ln) ?? '';
    const c = Num.clamp(1, (text.length ?? 0) + 1, col);
    return off + (c - 1);
  };

  const toOffsets = (d: t.Diagnostic): [number, number] => {
    if (Array.isArray(d.range)) {
      const start = d.range[0] ?? 0;
      const preferEnd = d.range[2] ?? d.range[1];
      const end = preferEnd ?? start + 1;
      return [start, Math.max(end, start + 1)];
    }
    if (Array.isArray(d.pos)) {
      const start = d.pos[0] ?? 0;
      const end = d.pos[1] ?? start + 1;
      return [start, Math.max(end, start + 1)];
    }

    // linePos → offsets:
    const [s, eRaw] = d.linePos!;
    const endLP = eRaw ?? s;

    const start = hasGetOffsetAt(model)
      ? model.getOffsetAt({ lineNumber: s.line, column: s.col })
      : offsetFromLineCol(s.line, s.col);

    const endCandidate = hasGetOffsetAt(model)
      ? model.getOffsetAt({ lineNumber: endLP.line, column: endLP.col })
      : offsetFromLineCol(endLP.line, endLP.col);

    const end = endCandidate === start ? start + 1 : endCandidate;
    return [start, end];
  };

  return errors.filter(hasLocation).map((d): t.Monaco.I.IMarkerData => {
    const [start, end] = toOffsets(d);
    const s = model.getPositionAt(start);
    const e = model.getPositionAt(end);

    const code = typeof d.code === 'string' ? d.code : d.code != null ? String(d.code) : undefined;
    const severity = d.severity ? Severity[d.severity] : Severity.Error;

    return {
      severity,
      message: d.message,
      code,
      startLineNumber: s.lineNumber,
      startColumn: s.column,
      endLineNumber: e.lineNumber,
      endColumn: e.column,
    };
  });
};

/**
 * Helpers:
 */
function hasLocation(d: t.Diagnostic) {
  return Array.isArray(d.range) || Array.isArray(d.pos) || (d.linePos && d.linePos.length >= 1);
}

function hasGetOffsetAt(m: any): m is { getOffsetAt(p: t.Offset): number } {
  return typeof m?.getOffsetAt === 'function';
}
