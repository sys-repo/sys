import React from 'react';
import { type t, Color, css } from './common.ts';

export const MobileLayout: React.FC<t.MobileLayoutProps> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);

  const styles = {
    base: css({
      backgroundColor: theme.bg,
      color: theme.fg,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{'🐷 Hello Mobile Layout'}</div>
    </div>
  );
};
