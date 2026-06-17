import React from 'react';

import { type t, Color, css, D } from './common.ts';
import { toCssSize, toFont, toLayout } from './u.ts';
import { Hr } from './ui.Hr.tsx';
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
  const keyTrack =
    isTable && layout.keyMax ? `fit-content(${toCssSize(layout.keyMax)})` : 'max-content';

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

    // Helpers for span-all in table mode:
    spanAll: css(isTable ? { gridColumn: '1 / 3' } : {}),
  };

  const keyOf = (item: t.KeyValue.Item, index: number) => item.id ?? index;

  const spanAll = (key: string | number, child?: t.ReactNode) => {
    return <div key={key} className={styles.spanAll.class} children={child} />;
  };

  const elRows = items.map((item, i) => {
    const key = keyOf(item, i);
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
      return <Row key={key} {...rowArgs} />;
    }

    // For non-row items, optionally span both columns in table mode:
    if (kind === 'title') return spanAll(key, <Title {...args} />);
    if (kind === 'hr') return spanAll(key, <Hr {...args} />);
    if (kind === 'spacer') return spanAll(key, <Spacer {...args} />);
  });

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      {elRows}
    </div>
  );
};
