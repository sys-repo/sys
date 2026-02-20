import React from 'react';
import { type t, css } from './common.ts';
import type { ResolvedHref } from './u.href.ts';

export type AnchorProps = {
  children?: t.ReactNode;
  link?: ResolvedHref;
  style?: t.CssInput;
};

/**
 * Thin anchor wrapper:
 * - No parsing/policy; caller provides a resolved link.
 */
export const Anchor: React.FC<AnchorProps> = (props) => {
  const { link, children } = props;
  if (!link) return <>{children}</>;

  return (
    <a
      className={css(props.style).class}
      href={link.href}
      target={link.target}
      rel={link.rel}
      children={children}
    />
  );
};
