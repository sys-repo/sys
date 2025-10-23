import React from 'react';
import { type t, Color, css } from './common.ts';
import { toEllipsis, toFont } from './u.ts';

type P = Omit<t.KeyValueItemProps, 'layout' | 'item'> & {
  layout: t.KeyValueLayoutSpaced;
  item: t.KeyValueRow;
};

export const RowSpaced: React.FC<P> = (props) => {
  const { debug = false, item, mono, truncate, layout } = props;
  const theme = Color.theme(props.theme);
  const { fontFamily } = toFont({ mono });

  const keyTrack = truncate ? 'fit-content(24ch)' : 'auto';
  const valueTrack = truncate ? '1fr' : 'minmax(16ch, 1fr)';

  const styles = {
    base: css({
      display: 'grid',
      gridTemplateColumns: `${keyTrack} ${valueTrack}`, // ← use both tracks
      columnGap: layout.columnGap ?? 12,
      alignItems: layout.align ?? 'baseline',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      fontFamily,
    }),
    key: css({ minWidth: 0, opacity: 0.7, textAlign: 'left', ...toEllipsis(truncate) }),
    val: css({ minWidth: 0, textAlign: truncate ? 'right' : 'left', ...toEllipsis(truncate) }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.key.class}>{item.k}</div>
      <div className={styles.val.class} title={typeof item.v === 'string' ? item.v : undefined}>
        {item.v}
      </div>
    </div>
  );
};
