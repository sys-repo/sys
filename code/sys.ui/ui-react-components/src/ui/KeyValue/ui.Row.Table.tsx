import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { toEllipsis, toFont } from './u.ts';

type P = Omit<t.KeyValueItemProps, 'layout' | 'item'> & {
  layout: t.KeyValueLayoutTable;
  item: t.KeyValueRow;
};

export const RowTable: React.FC<P> = (props) => {
  const { debug = false, item, mono, truncate, layout } = props;
  const theme = Color.theme(props.theme);
  const { fontFamily } = toFont({ mono });

  const styles = {
    row: css({
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
      ...toEllipsis(truncate),
    }),
    val: css({
      gridColumn: '2',
      textAlign: 'left',
      minWidth: 0,
      alignSelf: layout.align ?? 'baseline',
      ...toEllipsis(truncate),
    }),
  };

  return (
    <div className={styles.row.class}>
      <div className={styles.key.class}>{item.k}</div>
      <div className={styles.val.class}>{item.v}</div>
    </div>
  );
};
