import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, Rx, Obj, Str, Is, Spinners } from './common.ts';

export type SpinningProps = {
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Spinning: React.FC<SpinningProps> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      pointerEvents: 'none',
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Spinners.Bar theme={theme.name} />
    </div>
  );
};
