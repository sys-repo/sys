import React from 'react';
import { type t, css } from './common.ts';

export type CenterProps = {
  children?: t.ReactNode;
  style?: t.CssInput;
};

/**
 * Component: Places children in the center of a grid.
 */
export const Center: React.FC<CenterProps> = (props) => {
  const style = css({
    display: 'grid',
    placeItems: 'center',
  });
  return <div className={css(style, props.style).class}>{props.children}</div>;
};
