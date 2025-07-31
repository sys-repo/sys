import { type t } from './common.ts';
import { clear } from './m.Hidden.clear.ts';
import { fold } from './m.Hidden.fold.ts';
import { observe } from './m.Hidden.observe.ts';

export const EditorHidden: t.EditorHiddenLib = {
  observe,
  fold,
  clear,
};
