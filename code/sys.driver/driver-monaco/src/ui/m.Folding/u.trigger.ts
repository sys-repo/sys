import { type t } from './common.ts';

export const fold: t.EditorFoldingLib['fold'] = (editor, start, end = start) => {
  const s = Math.min(start, end) - 1; // → 0-based.
  const e = Math.max(start, end) - 1;
  const selectionLines = Array.from({ length: e - s + 1 }, (_, i) => s + i);
  editor.trigger('monaco.hidden', 'editor.fold', { selectionLines });
};

export const unfold: t.EditorFoldingLib['unfold'] = (editor, start, end = start) => {
  const s = Math.min(start, end) - 1;
  const e = Math.max(start, end) - 1;
  const selectionLines = Array.from({ length: e - s + 1 }, (_, i) => s + i);
  editor.trigger('monaco.hidden', 'editor.unfold', { selectionLines });
};

export const clear: t.EditorFoldingLib['clear'] = (editor) => {
  editor.trigger('monaco.hidden', 'editor.unfoldAll', undefined);
};
