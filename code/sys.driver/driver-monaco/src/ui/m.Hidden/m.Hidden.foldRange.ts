import { type t } from './common.ts';

export const foldRange: t.EditorHiddenLib['foldRange'] = (ed, start, end = start) => {
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
