import React from 'react';
import { type t, Color, css, D } from './common.ts';

export const SlugSheet: React.FC<t.SlugSheetProps> = (props) => {
  const { slots = {}, debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      gridTemplateRows: '1fr auto',
      gap: 12,
      padding: 12,
      backgroundColor: Color.ruby(debug),
      minHeight: 0,
      minWidth: 0,
      color: theme.fg,
    }),
    tree: css({
      gridColumn: 1,
      gridRow: '1 / span 2',
      minWidth: 0,
      minHeight: 0,
      overflow: 'hidden',
      backgroundColor: Color.alpha(theme.bg, 0.05),
      borderRadius: 4,
    }),
    main: css({
      gridColumn: 2,
      gridRow: 1,
      minWidth: 0,
      minHeight: 0,
      backgroundColor: Color.alpha(theme.bg, 0.02),
      borderRadius: 4,
    }),
    aux: css({
      gridColumn: 2,
      gridRow: 2,
      minWidth: 0,
      minHeight: 0,
    }),
    placeholder: css({
      display: 'grid',
      placeItems: 'center',
      minHeight: 120,
      color: Color.alpha(theme.fg, 0.5),
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <div className={styles.tree.class}>{slots.tree}</div>
      <div className={styles.main.class}>
        {slots.main ?? <div className={styles.placeholder.class}>Main content placeholder</div>}
      </div>
      {slots.aux && <div className={styles.aux.class}>{slots.aux}</div>}
    </div>
  );
};
