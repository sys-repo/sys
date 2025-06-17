import React from 'react';
import { type t, Color, css, D } from './common.ts';

export const CanvasLayout: React.FC<t.CanvasLayoutProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const border = props.border ?? `solid 5px ${Color.alpha(theme.fg, 1)}`;
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      border,
      display: 'grid',
      gridTemplateRows: `1fr 2.5fr 1fr`,
    }),
    row: css({
      borderBottom: border,
      ':last-child': { borderBottom: 'none' },
      display: 'grid',
    }),
    cell: css({
      borderRight: border,
      ':last-child': { borderRight: 'none' },
      display: 'grid',
    }),
    top: css({
      display: 'grid',
      gridTemplateColumns: `repeat(2, 1fr)`,
    }),
    middle: css({
      display: 'grid',
      gridTemplateColumns: `repeat(5, 1fr)`,
    }),
    bottom: css({
      display: 'grid',
      gridTemplateColumns: `repeat(2, 1fr)`,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={css(styles.row, styles.top).class}>
        <div className={styles.cell.class}>🐷 purpose</div>
        <div className={styles.cell.class}>🐷 impact</div>
      </div>
      <div className={css(styles.row, styles.middle).class}>
        <div className={styles.cell.class}>🐷 problem</div>
        <div className={styles.cell.class}>
          <div className={css(styles.row).class}>🐷 solution</div>
          <div className={styles.row.class}>🐷 key-metrics</div>
        </div>
        <div className={styles.cell.class}>🐷 UVP</div>
        <div className={styles.cell.class}>
          <div className={css(styles.row).class}>🐷 unfair advantage</div>
          <div className={styles.row.class}>🐷 channels</div>
        </div>
        <div className={styles.cell.class}>🐷 customer segments</div>
      </div>
      <div className={css(styles.row, styles.bottom).class}>
        <div className={styles.cell.class}>🐷 cost</div>
        <div className={styles.cell.class}>🐷 revenue</div>
      </div>
    </div>
  );
};
