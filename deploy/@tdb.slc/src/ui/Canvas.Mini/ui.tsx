import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS } from './common.ts';

type P = t.CanvasMiniProps;

/**
 * Component.
 */
export const CanvasMini: React.FC<P> = (props) => {
  const {} = props;

  /**
   * Render.
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
      <div>{`🐷 CanvasMini`}</div>
    </div>
  );
};
