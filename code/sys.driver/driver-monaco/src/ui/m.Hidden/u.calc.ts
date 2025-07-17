import { type t } from './common.ts';

/**
 * Derive folded (hidden) ranges by finding the gaps between the
 * editor’s visible ranges.
 */
export function calcHidden(editor: t.Monaco.Editor): t.Monaco.IRange[] {
  const model = editor.getModel();
  if (!model) return [];

  const visible = [...editor.getVisibleRanges()].sort((a, b) =>
    a.startLineNumber === b.startLineNumber
      ? a.startColumn - b.startColumn
      : a.startLineNumber - b.startLineNumber,
  );

  const hidden: t.Monaco.IRange[] = [];
  let line = 1;

  for (const r of visible) {
    if (line < r.startLineNumber) {
      hidden.push({
        startLineNumber: line,
        startColumn: 1,
        endLineNumber: r.startLineNumber - 1,
        endColumn: 1,
      });
    }
    line = r.endLineNumber + 1;
  }

  const lastLine = model.getLineCount();
  if (line <= lastLine) {
    hidden.push({
      startLineNumber: line,
      startColumn: 1,
      endLineNumber: lastLine,
      endColumn: 1,
    });
  }

  return hidden;
}
