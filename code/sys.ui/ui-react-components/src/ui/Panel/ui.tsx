import React from 'react';
import { type t, Color, css } from './common.ts';

export const Panel: React.FC<t.PanelProps> = (props) => {
  const { text = '🐷 Panel' } = props;

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
      padding: 3,
      borderRadius: 5,
      fontSize: 14,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{text}</div>
    </div>
  );
};
