import React from 'react';

import { Color, css, D, Is, type t } from './common.ts';
import {
  isGroup,
  isRow,
  toCssSize,
  toFont,
  toLayout,
  toProjectionAnimation,
  toReorderModel,
  type ProjectionAnimationModel,
} from './u/mod.ts';
import { entryMode, shouldEnter, toEntryChange } from './m.Cursor/u.event.ts';
import { focusCursorRoot, toNavigationHandler, toNavigationRootProps } from './m.Cursor/u.navigation.ts';
import { childScope, toBoundary, type Boundary as CursorBoundary } from './m.Cursor/u.render.ts';
import { Hr, ItemShell, ProjectionItemShell, ReorderList, Row, Spacer, Title } from './ui/mod.ts';

type RenderContext = Omit<t.KeyValue.ItemProps, 'item'> & {
  readonly layout: t.KeyValue.Layout;
  readonly rootItems: readonly t.KeyValue.Item[];
  readonly cursor?: t.KeyValue.Cursor.Props;
  readonly cursorCurrentFill: t.Color.Rgba;
  readonly projection?: ProjectionAnimationModel;
};

export const KeyValue: React.FC<t.KeyValue.Props> = (props) => {
  const { debug = false, items = [], size = D.size, mono = D.mono, truncate = D.truncate } = props;
  const enabled = props.enabled ?? D.enabled;
  const disabledOpacity = props.defaults?.disabledOpacity ?? D.defaults.disabledOpacity;
  const layout = toLayout(props.layout);
  const theme = Color.theme(props.theme);
  const cursorCurrentFill = Color.alpha(theme.fg, 0.06);
  const { fontSize, fontFamily } = toFont(props);

  const isTable = layout.kind === 'table';
  const keyTrack = isTable && layout.keyMax
    ? `fit-content(${toCssSize(layout.keyMax)})`
    : 'max-content';

  const styles = {
    base: css({
      position: 'relative',
      userSelect: 'none',
      boxSizing: 'border-box',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      fontSize,
      fontFamily,
      lineHeight: 1.35,
      outline: 'none',
      ':focus': { outline: 'none' },
      ':focus-visible': { outline: 'none' },

      // Switch container model:
      display: 'grid',
      gridTemplateColumns: isTable ? `${keyTrack} 1fr` : undefined,
      columnGap: isTable ? (layout.columnGap ?? 12) : undefined,
      rowGap: layout.rowGap ?? 4,
    }),
  };

  const style = css(styles.base, props.style);
  const className = style.class;
  const reorder = props.reorder;
  const onReorderChange = reorder?.onChange;
  const reorderModel = reorder && reorder.enabled !== false && onReorderChange
    ? toReorderModel(items, reorder)
    : undefined;

  /** Motion Reorder owns item motion while active; projection is the static path only. */
  const projection = reorderModel ? undefined : toProjectionAnimation(props.animation, items);
  const cursorNavigation = toNavigationHandler({ items, cursor: props.cursor });
  const renderContext: RenderContext = {
    theme: theme.name,
    enabled,
    disabledOpacity,
    mono,
    truncate,
    layout,
    rootItems: items,
    cursor: props.cursor,
    cursorCurrentFill,
    size,
    debug,
    projection,
  };

  if (reorderModel && onReorderChange) {
    return (
      <ReorderList
        style={style}
        dataComponent={D.displayName}
        layout={layout}
        model={reorderModel}
        onStart={reorder.onStart}
        onChange={onReorderChange}
        onEnd={reorder.onEnd}
        cursorNavigation={cursorNavigation}
        cursorCurrentFill={cursorCurrentFill}
        cursorBoundary={(item) => toCursorBoundary(item, renderContext, [])}
        renderItem={(item) => {
          const cursor = toCursorBoundary(item, renderContext, []);
          return renderItem(item, renderContext, 0, childScope(cursor));
        }}
      />
    );
  }

  const elRows = renderItems(items, renderContext);

  return (
    <div
      className={className}
      data-component={D.displayName}
      {...toNavigationRootProps(cursorNavigation)}
    >
      {elRows}
    </div>
  );
};

/**
 * Helpers:
 */
function renderItems(
  items: t.KeyValue.Item[],
  context: RenderContext,
  scopePath: t.ObjectPath | undefined = [],
  depth = 0,
) {
  const duplicateIds = toDuplicateIds(items);
  return items.map((item, index) => {
    const key = keyOf(item, index, duplicateIds);
    const cursor = toCursorBoundary(item, context, scopePath);
    const children = renderItem(item, context, depth, childScope(cursor));
    const projection = depth === 0 ? context.projection : undefined;

    if (projection) {
      return (
        <ProjectionItemShell
          key={key}
          item={item}
          layout={context.layout}
          projection={projection}
          cursor={cursor}
          currentFill={context.cursorCurrentFill}
        >
          {children}
        </ProjectionItemShell>
      );
    }

    return (
      <ItemShell
        key={key}
        item={item}
        layout={context.layout}
        cursor={cursor}
        currentFill={context.cursorCurrentFill}
      >
        {children}
      </ItemShell>
    );
  });
}

function renderItem(
  item: t.KeyValue.Item,
  context: RenderContext,
  depth = 0,
  groupScope?: t.ObjectPath,
) {
  const {
    cursor: _cursor,
    cursorCurrentFill: _cursorCurrentFill,
    projection: _projection,
    rootItems: _rootItems,
    ...itemContext
  } = context;
  const args: t.KeyValue.ItemProps = { ...itemContext, item };

  if (isRow(item)) {
    const rowArgs: t.KeyValue.ItemProps = { ...args, mono: item.mono ?? context.mono };
    return <Row {...rowArgs} />;
  }
  if (isGroup(item)) return renderItems(item.items, context, groupScope, depth + 1);
  if (item.kind === 'title') return <Title {...args} />;
  if (item.kind === 'hr') return <Hr {...args} />;
  if (item.kind === 'spacer') return <Spacer {...args} />;
  return null;
}

function toCursorBoundary(
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

function keyOf(item: t.KeyValue.Item, index: number, duplicateIds: ReadonlySet<string>) {
  const id = item.id;
  return isStableId(id) && !duplicateIds.has(id) ? id : index;
}

function toDuplicateIds(items: readonly t.KeyValue.Item[]): ReadonlySet<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  items.forEach((item) => {
    const id = item.id;
    if (!isStableId(id)) return;
    if (seen.has(id)) duplicates.add(id);
    else seen.add(id);
  });

  return duplicates;
}

function isStableId(id: unknown): id is string {
  return Is.string(id) && !Is.blank(id);
}
