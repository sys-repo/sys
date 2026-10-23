import React from 'react';
import { type t } from '../common.ts';
import { isGroup, isRow } from '../u/mod.ts';
import { Hr } from '../ui/ui.Hr.tsx';
import { Row } from '../ui.row/mod.ts';
import { Spacer } from '../ui/ui.Spacer.tsx';
import { Title } from '../ui/ui.Title.tsx';
import { toItemContext, type RenderContext } from './u.context.ts';
import { toRowCursorRender, type CursorBoundary } from './u.cursor.ts';

type RenderGroup = (
  items: readonly t.KeyValue.Item[],
  scopePath: t.ObjectPath | undefined,
  depth: number,
) => t.ReactNode;

type RenderItemArgs = {
  readonly item: t.KeyValue.Item;
  readonly context: RenderContext;
  readonly depth: number;
  readonly groupScope?: t.ObjectPath;
  readonly cursor?: CursorBoundary;
  readonly renderGroup: RenderGroup;
};

export function renderItem(args: RenderItemArgs) {
  const { item, context, cursor, depth, groupScope, renderGroup } = args;
  const itemProps: t.KeyValue.ItemProps = { ...toItemContext(context), item };

  if (isRow(item)) {
    const rowProps: t.KeyValue.ItemProps = { ...itemProps, mono: item.mono ?? context.mono };
    return <Row {...rowProps} cursor={toRowCursorRender(cursor, context)} />;
  }
  if (isGroup(item)) return renderGroup(item.items, groupScope, depth + 1);
  if (item.kind === 'title') return <Title {...itemProps} />;
  if (item.kind === 'hr') return <Hr {...itemProps} />;
  if (item.kind === 'spacer') return <Spacer {...itemProps} />;
  return null;
}
