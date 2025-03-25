import React from 'react';
import { type t, Color, css } from './common.ts';

export const MyComponent: React.FC<t.VideosIndexProps> = (props) => {
  const { text = '🐷 Hello' } = props;

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
      <div>{text}</div>
    </div>
  );
};
