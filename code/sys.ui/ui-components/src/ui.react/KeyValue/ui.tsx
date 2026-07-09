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
import { entryMode, shouldEnter, toEntryChange } from './m.Focus/u.event.ts';
import { focusNavigationRoot, toNavigationHandler, toNavigationRootProps } from './m.Focus/u.navigation.ts';
import { childScope, toBoundary, type Boundary as FocusBoundary } from './m.Focus/u.render.ts';
import { Hr, ItemShell, ProjectionItemShell, ReorderList, Row, Spacer, Title } from './ui/mod.ts';

type RenderContext = Omit<t.KeyValue.ItemProps, 'item'> & {
  readonly layout: t.KeyValue.Layout;
  readonly rootItems: readonly t.KeyValue.Item[];
  readonly focus?: t.KeyValue.Focus.Props;
  readonly projection?: ProjectionAnimationModel;
};

export const KeyValue: React.FC<t.KeyValue.Props> = (props) => {
  const { debug = false, items = [], size = D.size, mono = D.mono, truncate = D.truncate } = props;
  const enabled = props.enabled ?? D.enabled;
  const disabledOpacity = props.defaults?.disabledOpacity ?? D.defaults.disabledOpacity;
  const layout = toLayout(props.layout);
  const theme = Color.theme(props.theme);
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
  const focusNavigation = toNavigationHandler({ items, focus: props.focus });
  const renderContext: RenderContext = {
    theme: theme.name,
    enabled,
    disabledOpacity,
    mono,
    truncate,
    layout,
    rootItems: items,
    focus: props.focus,
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
        focusNavigation={focusNavigation}
        focusBoundary={(item) => toFocusBoundary(item, renderContext, [])}
        renderItem={(item) => {
          const focus = toFocusBoundary(item, renderContext, []);
          return renderItem(item, renderContext, 0, childScope(focus));
        }}
      />
    );
  }

  const elRows = renderItems(items, renderContext);

  return (
    <div
      className={className}
      data-component={D.displayName}
      {...toNavigationRootProps(focusNavigation)}
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
    const focus = toFocusBoundary(item, context, scopePath);
    const children = renderItem(item, context, depth, childScope(focus));
    const projection = depth === 0 ? context.projection : undefined;

    if (projection) {
      return (
        <ProjectionItemShell key={key} item={item} layout={context.layout} projection={projection} focus={focus}>
          {children}
        </ProjectionItemShell>
      );
    }

    return (
      <ItemShell key={key} item={item} layout={context.layout} focus={focus}>
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
  const { focus: _focus, projection: _projection, rootItems: _rootItems, ...itemContext } = context;
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

function toFocusBoundary(
  item: t.KeyValue.Item,
  context: RenderContext,
  scopePath: t.ObjectPath | undefined,
): FocusBoundary | undefined {
  const focus = context.focus;
  if (!focus || focus.enabled === false) return undefined;
  if (!scopePath) return {};

  const boundary = toBoundary(context.rootItems, scopePath, item);
  const mode = entryMode(focus.entry);
  const onChange = focus.onChange;
  const focusItem = boundary.item;
  if (!focusItem || !mode || !onChange) return boundary;

  const onClick: React.MouseEventHandler<HTMLElement> = (event) => {
    if (!shouldEnter(event, focus.entry)) return;
    const change = toEntryChange({
      entry: mode,
      model: focus.model ?? {},
      items: context.rootItems,
      ref: focusItem.ref,
    });
    if (change) {
      focusNavigationRoot({ current: event.currentTarget, focus });
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
