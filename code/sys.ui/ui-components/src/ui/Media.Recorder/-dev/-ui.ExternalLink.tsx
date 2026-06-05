import React from 'react';
import { type t, Color, css } from '../common.ts';

export type ExternalLinkProps = {
  children?: t.ReactNode;
  href?: string;
  style?: t.CssInput;
  theme?: t.CommonTheme;
};

/**
 * Component:
 */
export const ExternalLink: React.FC<ExternalLinkProps> = (props) => {
  const { href = '#', children } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      textDecoration: 'none',
      ':hover': { textDecoration: 'underline' },
    }),
  };

  return (
    <a
      className={css(styles.base, props.style).class}
      target="_blank"
      rel="noopener noreferrer"
      href={href}
      children={children}
    />
  );
};
