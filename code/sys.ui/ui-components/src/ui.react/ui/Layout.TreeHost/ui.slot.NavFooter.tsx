import React from 'react';
import { type t, Color, css } from './common.ts';

export type NavFooterProps = {
  children?: t.ReactNode;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const NavFooter: React.FC<NavFooterProps> = (props) => {
  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
  };

  return <div className={css(styles.base, props.style).class}>{props.children}</div>;
};
