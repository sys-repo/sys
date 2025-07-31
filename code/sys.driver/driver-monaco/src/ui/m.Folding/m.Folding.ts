import { type t } from './common.ts';
import { toMarkRanges } from './u.crdt.ts';
import { getHiddenAreas } from './u.hidden.ts';
import { observe } from './u.observe.ts';
import { clear, fold, unfold } from './u.trigger.ts';

export const EditorFolding: t.EditorFoldingLib = {
  observe,
  fold,
  unfold,
  clear,
  toMarkRanges,
  getHiddenAreas,
};
