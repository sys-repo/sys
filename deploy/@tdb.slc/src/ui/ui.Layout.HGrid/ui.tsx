import React from 'react';
import { type t, Color, css, D } from './common.ts';

export const LayoutHGrid: React.FC<t.LayoutHGridProps> = (props) => {
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
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{'🐷 Hello LayoutHGrid'}</div>
    </div>
  );
};
