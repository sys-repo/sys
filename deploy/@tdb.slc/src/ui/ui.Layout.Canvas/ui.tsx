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
    }),
    cell: css({
      padding: 8,
      borderRight: border,
      ':last-child': { borderRight: 'none' },
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
        <div className={styles.cell.class}>🐷</div>
        <div className={styles.cell.class}>🐷</div>
      </div>
      <div className={css(styles.row, styles.middle).class}>
        <div className={styles.cell.class}>🐷</div>
        <div className={styles.cell.class}>🐷</div>
        <div className={styles.cell.class}>🐷</div>
        <div className={styles.cell.class}>🐷</div>
        <div className={styles.cell.class}>🐷</div>
      </div>
      <div className={css(styles.row, styles.bottom).class}>
        <div className={styles.cell.class}>🐷</div>
        <div className={styles.cell.class}>🐷</div>
      </div>
    </div>
  );
};
