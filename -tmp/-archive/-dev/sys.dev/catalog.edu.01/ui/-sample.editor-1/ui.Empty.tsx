import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, D, DEFAULTS, Rx, Signal } from './common.ts';

export type EmptyProps = {
  children?: React.ReactNode;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Empty: React.FC<EmptyProps> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
    }),
    body: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{props.children}</div>
    </div>
  );
};
