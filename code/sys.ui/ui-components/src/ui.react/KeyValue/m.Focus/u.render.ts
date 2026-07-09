import type React from 'react';
import { Obj, type t } from '../common.ts';
import { Focus } from './mod.ts';

export const Data = {
  boundary: 'data-keyvalue-item-boundary',
  focusPath: 'data-keyvalue-focus-path',
} as const;

export type Boundary = {
  readonly item?: t.KeyValue.Focus.Item;
  readonly encodedPath?: string;
  readonly onClick?: React.MouseEventHandler<HTMLElement>;
};

export function toBoundary(
  items: readonly t.KeyValue.Item[],
  scopePath: t.ObjectPath,
  item: t.KeyValue.Item,
): Boundary {
  const focusItem = Focus.scope(items, scopePath).items.find((candidate) => candidate.item === item);
  return {
    item: focusItem,
    encodedPath: focusItem ? Obj.Path.encode(focusItem.ref.path) : undefined,
  };
}

export function childScope(boundary: Boundary | undefined): t.ObjectPath | undefined {
  return boundary?.item?.ref.path;
}
