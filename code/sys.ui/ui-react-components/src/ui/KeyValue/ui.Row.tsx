import React from 'react';
import { type t, Color, css } from './common.ts';
import { toEllipsis, toFont, toLayout } from './u.ts';

type P = t.KeyValueItemProps;

/**
 * Component:
 */
export const Row: React.FC<P> = (props) => {
  const { debug = false, item, mono, truncate } = props;
  if (item.kind != null && item.kind !== 'row') return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const layout = toLayout(props.layout);
  const { fontFamily } = toFont({ mono });
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      fontFamily,
      display: 'grid',
      gridTemplateColumns: layout.columnTemplate,
      columnGap: layout.columnGap,
      alignItems: 'baseline',
    }),
    key: css({ opacity: 0.7, minWidth: 0, ...toEllipsis(truncate) }),
    val: css({ minWidth: 0, ...toEllipsis(truncate) }),
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
