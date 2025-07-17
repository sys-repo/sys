import { type t } from './common.ts';
import { clear } from './m.Hidden.clear.ts';
import { foldRange } from './m.Hidden.foldRange.ts';
import { observe } from './m.Hidden.observe.ts';

export const EditorHidden: t.EditorHiddenLib = {
  observe,
  foldRange,
  clear,
};
