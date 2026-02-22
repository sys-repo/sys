import React from 'react';
import { type t, Color, css } from './common.ts';

export type HeaderProps = {
  children?: t.ReactNode;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Header: React.FC<HeaderProps> = (props) => {
  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
  };

  return <header className={css(styles.base, props.style).class}>{props.children}</header>;
};
