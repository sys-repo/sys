import { type t, A, Bus, D, RangeUtil } from './common.ts';

type IRange = t.Monaco.I.IRange;
type TextModel = t.Monaco.TextModel;
type OffsetLike = { start: number; end: number };

/** Clamp an offset to model bounds. */
export function clampOffset(model: TextModel, pos: number): number {
  if (model.isDisposed()) return 0;
  const max = model.getValueLength();
  const n = (pos | 0) as number;
  return n < 0 ? 0 : n > max ? max : n;
}

/** Clamp start/end positions to model bounds */
export function clampOffsetSE(model: TextModel, pos: OffsetLike): t.FoldOffset {
  return {
    start: clampOffset(model, pos.start),
    end: clampOffset(model, pos.end),
  };
}

/** Convert offsets → Monaco ranges (validated). */
export function offsetsToRanges(model: TextModel, offsets: t.FoldOffset[]): IRange[] {
  if (model.isDisposed()) return [];
  return offsets.map(({ start, end }) => {
    const s = model.getPositionAt(clampOffset(model, start));
    const e = model.getPositionAt(clampOffset(model, end));
    return model.validateRange({
      startLineNumber: s.lineNumber,
      startColumn: s.column,
      endLineNumber: e.lineNumber,
      endColumn: e.column,
    });
  });
}

/** Convert ranges → offsets. */
export function rangesToOffsets(model: TextModel, ranges: IRange[]): t.FoldOffset[] {
  if (model.isDisposed()) return [];
  return ranges.map((r) => ({
    start: model.getOffsetAt({ lineNumber: r.startLineNumber, column: r.startColumn }),
    end: model.getOffsetAt({ lineNumber: r.endLineNumber, column: r.endColumn }),
  }));
}

/** Stable comparison on offsets. */
export function equalOffsets(a: t.FoldOffset[], b: t.FoldOffset[]) {
  const norm = (xs: t.FoldOffset[]) => [...xs].sort((p, q) => p.start - q.start || p.end - q.end);
  const aa = norm(a);
  const bb = norm(b);
  if (aa.length !== bb.length) return false;
  return aa.every((r, i) => r.start === bb[i].start && r.end === bb[i].end);
}

/** Read CRDT fold marks as offsets. */
export function readStoredOffsets(doc: t.CrdtRef, path: t.ObjectPath): t.FoldOffset[] {
  try {
    return A.marks(doc.current, path)
      .filter((m) => m.name === D.FOLD_MARK)
      .map(({ start, end }) => ({ start, end }));
  } catch {
    return [];
  }
}

/** Compute 0-based parent line indices to fold from offsets. */
export function parentLinesFromOffsets(model: TextModel, offsets: t.FoldOffset[]) {
  const pos = (start: number) => Math.max(1, line(start) - 1);
  const line = (start: number) => model.getPositionAt(clampOffset(model, start)).lineNumber;
  const lines = offsets.map((e) => pos(e.start));
  return Array.from(new Set(lines)).sort((a, b) => a - b);
}

/** Curried "marks" emitter with model/bus/path baked in. */
export function makeMarksEmitter(bus$: t.EditorEventBus, model: TextModel, path: t.ObjectPath) {
  return (trigger: t.EventMarks['trigger'], prev: t.FoldOffset[], next: t.FoldOffset[]) => {
    if (equalOffsets(prev, next)) return;

    const before = offsetsToRanges(model, prev);
    const after = offsetsToRanges(model, next);

    if (RangeUtil.eql(before, after)) return;
    Bus.emit(bus$, { kind: 'editor:crdt:marks', trigger, path, change: { before, after } });
  };
}
