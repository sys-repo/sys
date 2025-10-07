import { type t, RangeUtil } from './common.ts';

type LinePos = { line: number; col: number };
type ErrWithTwoLinePos = t.YamlError & { linePos: readonly [LinePos, LinePos] };

export const errorsToMarkers: t.EditorYamlErrorLib['errorsToMarkers'] = (monaco, model, errors) => {
  return errors.map((err) => errorToMarker(monaco, model, err));
};

export const errorToMarker: t.EditorYamlErrorLib['errorToMarker'] = (monaco, model, err) => {
  let range: t.Monaco.I.IRange;

  if (hasTwoLinePos(err)) {
    const lp = err.linePos as readonly [LinePos, LinePos];
    const start = lp[0];
    const end = lp[1];
    range = RangeUtil.asRange([start.line, start.col, end.line, end.col]);
  } else if (err.pos?.[0] !== undefined) {
    const start = model.getPositionAt(err.pos[0]);
    const end = model.getPositionAt(err.pos[1] ?? err.pos[0]);
    range = RangeUtil.fromPosition(start, end);
  } else {
    range = RangeUtil.asRange(undefined);
  }

  return {
    ...range,
    message: err.message,
    code: err.code,
    source: 'yaml',
    severity: monaco.MarkerSeverity.Error,
  } satisfies t.Monaco.I.IMarkerData;
};

/**
 * Helpers:
 */
function hasTwoLinePos(e: t.YamlError): e is ErrWithTwoLinePos {
  const lp = (e as any).linePos;
  return Array.isArray(lp) && lp.length === 2 && isLinePos(lp[0]) && isLinePos(lp[1]);
}

function isLinePos(x: any): x is LinePos {
  return x && typeof x.line === 'number' && typeof x.col === 'number';
}
