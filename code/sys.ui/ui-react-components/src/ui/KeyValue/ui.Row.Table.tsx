import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { toFont, toRowOpacity, toSpacing } from './u.ts';
import { Cell } from './ui.Cell.tsx';

type P = Omit<t.KeyValueItemProps, 'layout' | 'item'> & {
  layout: t.KeyValueLayoutTable;
  item: t.KeyValueRow;
};

export const RowTable: React.FC<P> = (props) => {
  const { debug = false, item, mono, truncate, layout } = props;
  const opacity = toRowOpacity(item.opacity, { k: D.keyOpacity, v: 1 });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const spacing = toSpacing(item.x, item.y);
  const [mxL, mxR] = spacing.x;
  const [myT, myB] = spacing.y;
  const { fontFamily } = toFont({ mono });

  const styles = {
    base: css({
      Margin: spacing.edges,
      display: 'contents',
      color: theme.fg,
      fontFamily,
    }),
    key: css({
      gridColumn: '1',
      textAlign: layout.keyAlign ?? D.layout.table.keyAlign,
      minWidth: 0,
      maxWidth: layout.keyMax,
      alignSelf: layout.align ?? 'baseline',
      Margin: [myT, 0, myB, mxL],
    }),
    val: css({
      gridColumn: '2',
      textAlign: 'left',
      minWidth: 0,
      alignSelf: layout.align ?? D.layout.table.align,
      Margin: [myT, mxR, myB, 0],
    }),
  };

  return (
    <div className={styles.base.class}>
      <Cell
        role={'key'}
        layout={layout}
        theme={props.theme}
        debug={debug}
        mono={mono}
        truncate={truncate}
        size={props.size}
        style={styles.key}
        href={item.href}
        opacity={opacity.k}
        children={item.k}
      />
      <Cell
        role={'val'}
        layout={layout}
        theme={props.theme}
        debug={debug}
        mono={mono}
        truncate={truncate}
        size={props.size}
        userSelect={item.userSelect}
        style={styles.val}
        href={item.href}
        opacity={opacity.v}
        children={item.v}
      />
    </div>
  );
};
