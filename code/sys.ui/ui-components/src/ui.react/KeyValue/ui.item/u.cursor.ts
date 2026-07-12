import type React from 'react';
import { type t } from '../common.ts';
import { entryMode, shouldEnter, toEntryChange } from '../m.Cursor/u.event.ts';
import { focusCursorRoot } from '../m.Cursor/u.navigation.ts';
import { toBoundary, type Boundary as CursorBoundary } from '../m.Cursor/u.render.ts';
import { type RenderContext } from './u.context.ts';

export type { CursorBoundary };

export function toCursorBoundary(
  item: t.KeyValue.Item,
  context: RenderContext,
  scopePath: t.ObjectPath | undefined,
): CursorBoundary | undefined {
  const cursor = context.cursor;
  if (!cursor || cursor.enabled === false) return undefined;
  if (!scopePath) return {};

  const boundary = toBoundary(context.rootItems, scopePath, item, cursor.model);
  const mode = entryMode(cursor.entry);
  const onChange = cursor.onChange;
  const cursorItem = boundary.item;
  if (!cursorItem || !mode || !onChange) return boundary;

  const onClick: React.MouseEventHandler<HTMLElement> = (event) => {
    if (!shouldEnter(event, cursor.entry)) return;
    const change = toEntryChange({
      entry: mode,
      model: cursor.model ?? {},
      items: context.rootItems,
      target: cursorItem.target,
    });
    if (change) {
      focusCursorRoot({ current: event.currentTarget, cursor });
      onChange(change);
    }
  };

  return { ...boundary, onClick };
}

export function toRowCursorRender(boundary: CursorBoundary | undefined, context: RenderContext) {
  const current = boundary?.currentPart;
  return current ? { part: { current, fill: context.cursorPartFill } } : undefined;
}
