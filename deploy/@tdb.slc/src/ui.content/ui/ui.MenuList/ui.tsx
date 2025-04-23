import React from 'react';
import { type t, Color, css, D } from './common.ts';

export const MenuList: React.FC<t.MenuListProps> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
    }),
    body: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{`🐷 ${D.displayName}`}</div>
    </div>
  );
};
