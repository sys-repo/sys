import { type t } from './common.ts';
import { clear, fold, unfold } from './u.folding.ts';
import { observe } from './u.observe.ts';

export const EditorFolding: t.EditorFoldingLib = {
  observe,
  fold,
  unfold,
  clear,
};
