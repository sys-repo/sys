import type React from 'react';
import { Obj, type t } from '../../common.ts';
import { Cursor } from '../mod.ts';

export const DataAttr = {
  root: 'data-keyvalue-cursor-root',
  boundary: 'data-keyvalue-item-boundary',
  cursorPath: 'data-keyvalue-cursor-path',
  current: 'data-keyvalue-cursor-current',
  currentPart: 'data-keyvalue-cursor-current-part',
} as const;

export type Boundary = {
  readonly item?: t.KeyValue.Cursor.Item;
  readonly encodedPath?: string;
  readonly current?: boolean;
  readonly currentPart?: t.KeyValue.Cursor.Part;
  readonly onClick?: React.MouseEventHandler<HTMLElement>;
};

export function toBoundary(
  items: t.KeyValue.Item[],
  scopePath: t.ObjectPath,
  item: t.KeyValue.Item,
  model?: t.KeyValue.Cursor.Model,
): Boundary {
  const cursorItem = Cursor.scope(items, scopePath).items.find((candidate) =>
    candidate.item === item
  );
  const part = model?.current?.part;
  const pathCurrent = cursorItem
    ? Obj.Path.eql(model?.current?.path, cursorItem.target.path)
    : false;
  const currentPart = pathCurrent && part && cursorItem?.parts.includes(part) ? part : undefined;
  const current = cursorItem
    ? Cursor.eql(model?.current, cursorItem.target) || !!currentPart
    : undefined;
  return {
    item: cursorItem,
    encodedPath: cursorItem ? Obj.Path.encode(cursorItem.target.path) : undefined,
    current,
    currentPart,
  };
}

export function childScope(boundary: Boundary | undefined): t.ObjectPath | undefined {
  return boundary?.item?.target.path;
}
