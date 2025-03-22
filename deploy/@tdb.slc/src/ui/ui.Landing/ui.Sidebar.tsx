import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx } from './common.ts';

export type SidebarProps = {
  width?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

type P = SidebarProps;

/**
 * Component:
 */
export const Sidebar: React.FC<P> = (props) => {
  const { width } = props;
  const bgBlur = 20;

  console.log('width', width);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.alpha(theme.fg, 0.06),
      color: theme.fg,
      overflow: 'hidden',
      backdropFilter: `blur(${bgBlur}px)`,
      display: 'grid',
    }),
    body: css({
      borderLeft: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
      padding: 10,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{`🐷 Sidebar`}</div>
    </div>
  );
};
