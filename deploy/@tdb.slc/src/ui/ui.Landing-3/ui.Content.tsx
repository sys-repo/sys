import React from 'react';
import { type t, css, LayoutDesktop, LayoutIntermediate, LayoutMobile } from './common.ts';

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
  const { breakpoint } = props;

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
      {wrangle.layoutElement(props)}
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  layoutElement(props: P) {
    const { breakpoint, signals } = props;
    const is = breakpoint.is;

    if (is.mobile) return <LayoutMobile signals={signals} />;
    if (is.intermediate) return <LayoutIntermediate signals={signals} />;
    if (is.desktop) return <LayoutDesktop signals={signals} />;

    return <div>{`Unsupported supported breakpoint: "${breakpoint.name}"`}</div>;
  },
} as const;
