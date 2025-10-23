import { type t } from './common.ts';
import { fromObject } from './u.fromObject.ts';
import { KeyValue as View } from './ui.tsx';

export const KeyValue: t.KeyValueLib = {
  View,
  fromObject,
};
