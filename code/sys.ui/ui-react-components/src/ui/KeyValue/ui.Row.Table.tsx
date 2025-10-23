import React from 'react';
import { type t, Color, css } from './common.ts';
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
      display: 'table-row',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      fontFamily,
    }),
    key: css({
      display: 'table-cell',
      verticalAlign: layout.align === 'baseline' ? 'baseline' : (layout.align ?? 'baseline'),
      textAlign: layout.keyAlign ?? 'left',
      opacity: 0.7,
      maxWidth: layout.keyMax, // optional cap
      ...toEllipsis(truncate),
      // spacing to value cell
      paddingRight: layout.columnGap ?? 12,
      whiteSpace: 'nowrap', // typical table-label behavior
    }),
    val: css({
      display: 'table-cell',
      verticalAlign: layout.align === 'baseline' ? 'baseline' : (layout.align ?? 'baseline'),
      width: '100%',
      ...toEllipsis(truncate),
    }),
  };

  return (
    <div className={styles.row.class}>
      <div className={styles.key.class}>{item.k}</div>
      <div className={styles.val.class} title={typeof item.v === 'string' ? item.v : undefined}>
        {item.v}
      </div>
    </div>
  );
};
