import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { toEllipsis, toFont, toSpacing } from './u.ts';

type P = Omit<t.KeyValueItemProps, 'layout' | 'item'> & {
  layout: t.KeyValueLayoutTable;
  item: t.KeyValueRow;
};

export const RowTable: React.FC<P> = (props) => {
  const { debug = false, item, mono, truncate, layout } = props;

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
      opacity: 0.55,
      textAlign: layout.keyAlign ?? D.layout.table.keyAlign,
      minWidth: 0,
      maxWidth: layout.keyMax,
      alignSelf: layout.align ?? 'baseline',
      Margin: [myT, 0, myB, mxL],
      ...toEllipsis(truncate),
    }),
    val: css({
      gridColumn: '2',
      textAlign: 'left',
      minWidth: 0,
      alignSelf: layout.align ?? D.layout.table.align,
      Margin: [myT, mxR, myB, 0],
      ...toEllipsis(truncate),
    }),
  };

  return (
    <div className={styles.base.class}>
      <div className={styles.key.class}>{item.k}</div>
      <div className={styles.val.class}>{item.v}</div>
    </div>
  );
};
