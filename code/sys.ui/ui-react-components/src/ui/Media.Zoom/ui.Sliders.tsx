import React from 'react';
import { type t, Color, css, D } from './common.ts';

export const Sliders: React.FC<t.MediaZoomSlidersProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      // backgroundColor: Color.ruby(debug),
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 ${D.displayName}.Sliders`}</div>
    </div>
  );
};
