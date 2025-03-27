import React from 'react';
import { type t, css, Layout } from './common.ts';

export type ContentProps = {
  signals?: t.AppSignals;
  breakpoint: t.Breakpoint;
  style?: t.CssInput;
};

type P = ContentProps;

/**
 * Component:
 */
export const Content: React.FC<P> = (props) => {
  const { breakpoint, signals } = props;

  /**
   * Render:
   */
  const styles = {
    base: css({ display: 'grid' }),
    layout: css({}),
  };

  const elNotReady = !breakpoint.is.ready && (
    <div className={styles.layout.class}>{/* Not Ready */}</div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elNotReady}
      {Layout.render(breakpoint, signals)}
    </div>
  );
};
