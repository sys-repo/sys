import { type t } from './common.ts';
import { Switches } from '../KeyValue.Switches/mod.ts';
import { Cursor } from './m.Cursor/mod.ts';
import { fromObject } from './u/mod.ts';
import { KeyValue as UI } from './ui.tsx';
import { ActionButton } from './ui/ui.ActionButton.tsx';

/** Key-value renderer with switches and object conversion helpers. */
export const KeyValue: t.KeyValue.Lib = {
  UI,
  ActionButton,
  Cursor,
  Switches,
  fromObject,
};
