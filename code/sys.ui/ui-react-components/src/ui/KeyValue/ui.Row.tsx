import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { toCssSize, toEllipsis, toFont, toLayout } from './u.ts';

type P = t.KeyValueItemProps;

/**
 * Component:
 */
export const Row: React.FC<P> = (props) => {
  const { debug = false, item, mono, truncate } = props;
  if (item.kind != null && item.kind !== 'row') return null;

  const layout = toLayout(props.layout);
  const { fontFamily } = toFont({ mono });
  const theme = Color.theme(props.theme);

  /**
   * Inline vs. Table:
   */
  if (layout.variant === 'table') {
    const styles = {
      row: css({ display: 'table-row', backgroundColor: Color.ruby(debug) }),
      key: css({
        display: 'table-cell',
        verticalAlign: layout.align === 'baseline' ? 'baseline' : (layout.align as any),
        textAlign: layout.keyAlign,
        opacity: 0.7,
        fontFamily,
        color: theme.fg,
        ...toEllipsis(truncate),
      }),
      val: css({
        display: 'table-cell',
        verticalAlign: layout.align === 'baseline' ? 'baseline' : (layout.align as any),
        fontFamily,
        color: theme.fg,
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
  }

  /**
   * Inline (Finder-like):
   */
  const styles = {
    base: css({
      display: 'grid',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      fontFamily,
      gridTemplateColumns: `fit-content(${toCssSize(layout.keyMax)}) 1fr`,
      columnGap: layout.columnGap,
      alignItems: layout.align,
    }),
    key: css({
      minWidth: 0,
      opacity: 0.7,
      textAlign: layout.keyAlign,
      ...toEllipsis(truncate),
    }),
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
