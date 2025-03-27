import React from 'react';
import { type t, css, MobileLayout } from './common.ts';
import { LayoutDesktop } from './ui.Layout.Desktop.tsx';
import { LayoutIntermediate } from './ui.Layout.Intermediate.tsx';

export type ContentProps = {
  signals?: t.SlcSignals;
  breakpoint: t.Breakpoint;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

type P = ContentProps;

/**
 * Component:
 */
export const Content: React.FC<P> = (props) => {
  const { breakpoint, theme } = props;

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
      {wrangle.current(props)}
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  current(props: P) {
    const { breakpoint, signals, theme } = props;
    const is = breakpoint.is;

    if (is.mobile) {
      return <MobileLayout theme={theme} signals={signals} />;
    }

    if (is.intermediate) {
      return <LayoutIntermediate theme={theme} signals={signals} />;
    }

    if (is.desktop) {
      return <LayoutDesktop theme={theme} signals={signals} />;
    }

    return;
  },
} as const;
