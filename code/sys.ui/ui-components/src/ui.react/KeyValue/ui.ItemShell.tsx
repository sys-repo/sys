import React from 'react';
import { css, D, type t } from './common.ts';
import { toLayout } from './u.ts';

type P = {
  item: t.KeyValue.Item;
  layout?: t.KeyValue.Layout;
  children?: t.ReactNode;
};

/**
 * CSS class for the internal per-item KeyValue boundary.
 */
export function itemShellClass(item: t.KeyValue.Item, layout?: t.KeyValue.Layout) {
  const resolved = toLayout(layout);
  const kind = item.kind ?? 'row';
  const isRow = kind === 'row';
  const isGroup = kind === 'group';
  const isTable = resolved.kind === 'table';
  const usesSubgrid = isTable && (isRow || isGroup);
  const isRecursiveShell = isGroup;

  /**
   * Table rows and groups use a column subgrid so cells keep participating in
   * the parent KeyValue table tracks while the item itself has a real DOM box.
   */
  return css({
    position: 'relative',
    boxSizing: 'border-box',
    minWidth: 0,
    display: usesSubgrid || isRecursiveShell ? 'grid' : 'flow-root',
    gridColumn: isTable ? '1 / -1' : undefined,
    gridTemplateColumns: usesSubgrid ? 'subgrid' : undefined,
    rowGap: isRecursiveShell ? (resolved.rowGap ?? D.layout.spaced.rowGap) : undefined,
  }).class;
}

/**
 * Internal per-item boundary for KeyValue render items.
 */
export const ItemShell: React.FC<P> = (props) => {
  return <div className={itemShellClass(props.item, props.layout)}>{props.children}</div>;
};
