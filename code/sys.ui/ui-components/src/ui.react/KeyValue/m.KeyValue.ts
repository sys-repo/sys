import { type t } from './common.ts';
import { Switches } from '../KeyValue.Switches/mod.ts';
import { fromObject } from './u/u.fromObject.ts';
import { KeyValue as UI } from './ui.tsx';

/** Key-value renderer with switches and object conversion helpers. */
export const KeyValue: t.KeyValue.Lib = {
  UI,
  Switches,
  fromObject,
};
