import React from 'react';
import { type t, Color, css } from './common.ts';

export type AProps = {
  children?: t.ReactNode;
  href?: t.StringUrl;
  target?: '_blank' | '_self' | '_parent' | '_top';
  style?: t.CssInput;
};

/**
 * Component: <a> link anchor
 */
export const A: React.FC<AProps> = (props) => {
  const isBlank = props.target === '_blank';

  /**
   * Render:
   */
  const styles = {
    base: css({
      color: 'inherit',
      textDecoration: 'none',
      ':hover': { color: Color.BLUE, textDecoration: 'underline' },
    }),
  };

  return (
    <a
      href={props.href}
      target={props.target}
      rel={isBlank ? 'noopener noreferrer' : undefined}
      className={css(styles.base, props.style).class}
    >
      {props.children}
    </a>
  );
};
