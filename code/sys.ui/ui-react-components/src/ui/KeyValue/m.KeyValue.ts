import { type t } from './common.ts';
import { fromObject } from './u.fromObject.ts';
import { KeyValue as UI } from './ui.tsx';

export const KeyValue: t.KeyValueLib = {
  UI,
  fromObject,
};
