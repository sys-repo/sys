import React from 'react';

import { Color, css, D, type t } from './common.ts';
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
import { Hr, ItemShell, ProjectionItemShell, ReorderList, Row, Spacer, Title } from './ui/mod.ts';

type RenderContext = Omit<t.KeyValue.ItemProps, 'item'> & {
  readonly layout: t.KeyValue.Layout;
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
  const renderContext: RenderContext = {
    theme: theme.name,
    enabled,
    disabledOpacity,
    mono,
    truncate,
    layout,
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
        renderItem={(item) => renderItem(item, renderContext)}
      />
    );
  }

  const elRows = renderItems(items, renderContext);

  return (
    <div className={className} data-component={D.displayName}>
      {elRows}
    </div>
  );
};

/**
 * Helpers:
 */
function renderItems(items: t.KeyValue.Item[], context: RenderContext, depth = 0) {
  return items.map((item, index) => {
    const key = keyOf(item, index);
    const children = renderItem(item, context, depth);
    const projection = depth === 0 ? context.projection : undefined;

    if (projection) {
      return (
        <ProjectionItemShell key={key} item={item} layout={context.layout} projection={projection}>
          {children}
        </ProjectionItemShell>
      );
    }

    return (
      <ItemShell key={key} item={item} layout={context.layout}>
        {children}
      </ItemShell>
    );
  });
}

function renderItem(item: t.KeyValue.Item, context: RenderContext, depth = 0) {
  const { projection: _projection, ...itemContext } = context;
  const args: t.KeyValue.ItemProps = { ...itemContext, item };

  if (isRow(item)) {
    const rowArgs: t.KeyValue.ItemProps = { ...args, mono: item.mono ?? context.mono };
    return <Row {...rowArgs} />;
  }
  if (isGroup(item)) return renderItems(item.items, context, depth + 1);
  if (item.kind === 'title') return <Title {...args} />;
  if (item.kind === 'hr') return <Hr {...args} />;
  if (item.kind === 'spacer') return <Spacer {...args} />;
  return null;
}

function keyOf(item: t.KeyValue.Item, index: number) {
  return item.id ?? index;
}
