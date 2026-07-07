import { type t } from './common.ts';

/** Check whether a KeyValue item is a row. */
export function isRow(item: t.KeyValue.Item): item is t.KeyValue.Row {
  return (item.kind ?? 'row') === 'row';
}

/** Check whether a KeyValue item is a recursive group. */
export function isGroup(item: t.KeyValue.Item): item is t.KeyValue.Group {
  return item.kind === 'group';
}
