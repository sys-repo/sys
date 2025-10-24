import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, D, Rx, Signal } from './common.ts';
import { edgeBorder } from './u.ts';

export type TitleBarProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const TitleBar: React.FC<TitleBarProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      Padding: [5, 12, 5, 8],
      backgroundColor: Color.alpha(theme.fg, 0.06),
      borderTop: edgeBorder(theme),
      borderBottom: edgeBorder(theme),
      fontSize: 13,
      lineHeight: 1.2,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{props.left}</div>
      <div />
      <div>{props.right}</div>
    </div>
  );
};
