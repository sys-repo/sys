import { type t } from './common.ts';
import { clear, fold, unfold } from './m.Hidden.folding.ts';
import { observe } from './m.Hidden.observe.ts';

export const EditorHidden: t.EditorFoldingLib = {
  observe,
  fold,
  unfold,
  clear,
};
