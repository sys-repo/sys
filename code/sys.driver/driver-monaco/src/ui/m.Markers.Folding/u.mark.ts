import { type t } from './common.ts';

/**
 * Convert editor hidden areas → Automerge sequence ranges.
 * Stores the *parent* (twisty) line as `start`.
 */
export function toMarkRanges(
  model: t.Monaco.TextModel,
  areas: t.Monaco.I.IRange[],
): t.Crdt.Marks.Range[] {
  return areas.map((r) => {
    // Parent line = line ABOVE the first hidden line, but never < 1.
    const parentLine = Math.max(1, r.startLineNumber - 1);
    const start = model.getOffsetAt({ lineNumber: parentLine, column: 1 });

    // Inclusive char offset of the last folded line.
    const end =
      r.endLineNumber < model.getLineCount()
        ? model.getOffsetAt({ lineNumber: r.endLineNumber + 1, column: 1 }) - 1
        : model.getOffsetAt({
            lineNumber: r.endLineNumber,
            column: model.getLineMaxColumn(r.endLineNumber),
          }) - 1;

    const range: t.Crdt.Marks.Range = { start, end, expand: 'none' };
    return range;
  });
}
