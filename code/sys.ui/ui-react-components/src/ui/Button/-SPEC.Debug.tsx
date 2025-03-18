import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx } from './common.ts';

export type DebugProps = {
  ctx: {};
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

type P = DebugProps;

/**
 * Component
 */
export const Debug: React.FC<P> = (props) => {
  const {} = props;

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 Debug`}</div>
    </div>
  );
};
