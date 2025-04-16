import React from 'react';
import { type t, css, Layout } from './common.ts';

export type ContentProps = {
  state?: t.AppSignals;
  breakpoint: t.Breakpoint;
  style?: t.CssInput;
};

type P = ContentProps;

/**
 * Component:
 */
export const Content: React.FC<P> = (props) => {
  const { breakpoint, state } = props;

  /**
   * Render:
   */
  const styles = {
    base: css({ display: 'grid' }),
  };

  const className = css(styles.base, props.style).class;
  const el = Layout.render(breakpoint, state);
  return <div className={className}>{el}</div>;
};
