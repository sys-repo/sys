import React from 'react';
import { type t } from '../common.ts';
import { childScope } from '../m.Cursor/u.render.ts';
import { renderItem } from './ui.Item.tsx';
import { ItemFrame } from './ui.ItemFrame.tsx';
import { type RenderContext } from './u.context.ts';
import { toCursorBoundary, type CursorBoundary } from './u.cursor.ts';
import { keyOf, toDuplicateIds } from './u.identity.ts';

export function renderItems(
  items: readonly t.KeyValue.Item[],
  context: RenderContext,
  scopePath: t.ObjectPath | undefined = [],
  depth = 0,
) {
  const duplicateIds = toDuplicateIds(items);

  return items.map((item, index) => {
    const key = keyOf(item, index, duplicateIds);
    const cursor = toCursorBoundary(item, context, scopePath);
    const children = renderItem({
      item,
      context,
      depth,
      cursor,
      groupScope: childScope(cursor),
      renderGroup: (items, scopePath, depth) => renderItems(items, context, scopePath, depth),
    });

    return (
      <ItemFrame key={key} item={item} context={context} cursor={cursor} depth={depth}>
        {children}
      </ItemFrame>
    );
  });
}

export function renderRootItem(
  item: t.KeyValue.Item,
  context: RenderContext,
  cursor?: CursorBoundary,
) {
  return renderItem({
    item,
    context,
    cursor,
    depth: 0,
    groupScope: childScope(cursor),
    renderGroup: (items, scopePath, depth) => renderItems(items, context, scopePath, depth),
  });
}
