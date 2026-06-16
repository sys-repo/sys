import { type t } from './common.ts';
import { Switches } from '../KeyValue.Switches/mod.ts';
import { fromObject } from './u.fromObject.ts';
import { KeyValue as UI } from './ui.tsx';

export const KeyValue: t.KeyValue.Lib = {
  UI,
  Switches,
  fromObject,
};
