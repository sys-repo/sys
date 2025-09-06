import { type t } from './common.ts';
import { getHiddenAreas } from './u.hidden.ts';
import { toMarkRanges } from './u.mark.ts';
import { observe } from './u.observe.ts';
import { clear, fold, unfold } from './u.trigger.ts';
import { useFoldMarks } from './use.FoldMarks.ts';

export const EditorFolding: t.EditorFoldingLib = {
  observe,
  fold,
  unfold,
  clear,
  toMarkRanges,
  getHiddenAreas,

  // React:
  useFoldMarks,
};
