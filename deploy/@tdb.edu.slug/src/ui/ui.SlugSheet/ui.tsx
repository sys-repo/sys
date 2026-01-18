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
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      minHeight: 0,
      minWidth: 0,
      display: 'grid',
    }),
    main: css({
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <div className={styles.main.class}>{slots.main}</div>
    </div>
  );
};
