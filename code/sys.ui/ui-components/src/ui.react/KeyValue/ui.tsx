import React from 'react';

import { Color, css, D, type t } from './common.ts';
import { toCssSize, toFont, toLayout } from './u.ts';
import { toReorderModel } from './u.reorder.ts';
import { Hr } from './ui.Hr.tsx';
import { ItemShell } from './ui.ItemShell.tsx';
import { ReorderList } from './ui.Reorder.tsx';
import { Row } from './ui.Row.tsx';
import { Spacer } from './ui.Spacer.tsx';
import { Title } from './ui.Title.tsx';

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

  const keyOf = (item: t.KeyValue.Item, index: number) => item.id ?? index;
  const style = css(styles.base, props.style);
  const className = style.class;
  const reorder = props.reorder;
  const onReorderChange = reorder?.onChange;
  const reorderModel = reorder && reorder.enabled !== false && onReorderChange
    ? toReorderModel(items, reorder)
    : undefined;

  const renderItem = (item: t.KeyValue.Item) => {
    const kind = item.kind ?? 'row';
    const args: t.KeyValue.ItemProps = {
      theme: theme.name,
      item,
      enabled,
      disabledOpacity,
      mono,
      truncate,
      layout,
      size,
      debug,
    };

    if (kind === 'row') {
      const row = item as t.KeyValue.Row;
      const rowArgs: t.KeyValue.ItemProps = { ...args, mono: row.mono ?? mono };
      return <Row {...rowArgs} />;
    }
    if (kind === 'title') return <Title {...args} />;
    if (kind === 'hr') return <Hr {...args} />;
    if (kind === 'spacer') return <Spacer {...args} />;
    return null;
  };

  if (reorderModel && onReorderChange) {
    return (
      <ReorderList
        style={style}
        dataComponent={D.displayName}
        layout={layout}
        model={reorderModel}
        onChange={onReorderChange}
        renderItem={renderItem}
      />
    );
  }

  const elRows = items.map((item, i) => {
    const key = keyOf(item, i);
    return (
      <ItemShell key={key} item={item} layout={layout}>
        {renderItem(item)}
      </ItemShell>
    );
  });

  return (
    <div className={className} data-component={D.displayName}>
      {elRows}
    </div>
  );
};
