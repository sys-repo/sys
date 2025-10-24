import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { toEllipsis, toFont, toSpacing } from './u.ts';

type P = Omit<t.KeyValueItemProps, 'layout' | 'item'> & {
  layout: t.KeyValueLayoutSpaced;
  item: t.KeyValueRow;
};

export const RowSpaced: React.FC<P> = (props) => {
  const { debug = false, item, mono, truncate, layout } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const keyTrack = truncate ? 'fit-content(24ch)' : 'auto';
  const valueTrack = truncate ? '1fr' : 'minmax(16ch, 1fr)';
  const spacing = toSpacing(item.x, item.y);
  const { fontFamily } = toFont({ mono });
  const styles = {
    base: css({
      Margin: spacing.edges,
      display: 'grid',
      gridTemplateColumns: `${keyTrack} ${valueTrack}`,
      columnGap: layout.columnGap ?? 12,
      alignItems: layout.align ?? D.layout.spaced.align,
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      fontFamily,
    }),
    key: css({
      fontFamily: 'sans-serif',
      minWidth: 0,
      opacity: 0.5,
      textAlign: 'left',
      ...toEllipsis(truncate),
    }),
    val: css({
      minWidth: 0,
      textAlign: truncate ? 'right' : 'left',
      ...toEllipsis(truncate),
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.key.class}>{item.k}</div>
      <div className={styles.val.class}>{item.v}</div>
    </div>
  );
};
