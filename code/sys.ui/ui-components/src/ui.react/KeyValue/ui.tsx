import React from 'react';

import { Color, css, D, type t } from './common.ts';
import { isGroup, isRow } from './u/u.is.ts';
import { toReorderModel } from './u/u.reorder.ts';
import { toCssSize, toFont, toLayout } from './u.ts';
import { Hr } from './ui.Hr.tsx';
import { ItemShell } from './ui.ItemShell.tsx';
import { ReorderList } from './ui.Reorder.tsx';
import { Row } from './ui.Row.tsx';
import { Spacer } from './ui.Spacer.tsx';
import { Title } from './ui.Title.tsx';

type RenderContext = Omit<t.KeyValue.ItemProps, 'item'> & { readonly layout: t.KeyValue.Layout };

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
  const renderContext: RenderContext = {
    theme: theme.name,
    enabled,
    disabledOpacity,
    mono,
    truncate,
    layout,
    size,
    debug,
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
function renderItems(items: t.KeyValue.Item[], context: RenderContext) {
  return items.map((item, index) => {
    const key = keyOf(item, index);
    return (
      <ItemShell key={key} item={item} layout={context.layout}>
        {renderItem(item, context)}
      </ItemShell>
    );
  });
}

function renderItem(item: t.KeyValue.Item, context: RenderContext) {
  const args: t.KeyValue.ItemProps = { ...context, item };

  if (isRow(item)) {
    const rowArgs: t.KeyValue.ItemProps = { ...args, mono: item.mono ?? context.mono };
    return <Row {...rowArgs} />;
  }
  if (isGroup(item)) return renderItems(item.items, context);
  if (item.kind === 'title') return <Title {...args} />;
  if (item.kind === 'hr') return <Hr {...args} />;
  if (item.kind === 'spacer') return <Spacer {...args} />;
  return null;
}

function keyOf(item: t.KeyValue.Item, index: number) {
  return item.id ?? index;
}
