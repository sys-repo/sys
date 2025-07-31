import { type t } from './common.ts';

export const fold: t.EditorHiddenLib['fold'] = (ed, start, end = start) => {
  const editor = ed as t.Monaco.Editor & t.EditorHiddenMembers;

  const range: t.Monaco.I.IRange = {
    startLineNumber: start,
    startColumn: 1,
    endLineNumber: end,
    endColumn: 1,
  };

  // Preserve any folds the user already has:
  const current = editor.getHiddenAreas?.() ?? [];
  editor.setHiddenAreas([...current, range]);
};

export const unfold: t.EditorHiddenLib['fold'] = (ed, start, end = start) => {
  const editor = ed as t.Monaco.Editor & t.EditorHiddenMembers;
  // const s = start;
  // const end = end;

  /** Helper: subtract the [s,e] slice from a hidden range (may split). */
  const subtract = (r: t.Monaco.I.IRange): t.Monaco.I.IRange[] => {
    // No overlap → keep as-is.
    if (end < r.startLineNumber || start > r.endLineNumber) return [r];

    const out: t.Monaco.I.IRange[] = [];

    // Left fragment (above the unfold slice).
    if (start > r.startLineNumber) {
      out.push({
        startLineNumber: r.startLineNumber,
        startColumn: 1,
        endLineNumber: start - 1,
        endColumn: 1,
      });
    }

    // Right fragment (below the unfold slice):
    if (end < r.endLineNumber) {
      out.push({
        startLineNumber: end + 1,
        startColumn: 1,
        endLineNumber: r.endLineNumber,
        endColumn: 1,
      });
    }

    return out;
  };

  const current = editor.getHiddenAreas?.() ?? [];
  const next = current.flatMap(subtract);

  editor.setHiddenAreas(next);
};
