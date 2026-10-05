import React from 'react';
import { type t, Color, css } from './common.ts';

export type FooterProps = {
  children?: t.ReactNode;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Footer: React.FC<FooterProps> = (props) => {
  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
  };

  return <footer className={css(styles.base, props.style).class}>{props.children}</footer>;
};
