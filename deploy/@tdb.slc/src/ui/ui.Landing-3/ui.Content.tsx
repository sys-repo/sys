import React from 'react';
import { type t, css, MobileLayout } from './common.ts';
import { LayoutDesktop } from './ui.Layout.Desktop.tsx';
import { LayoutIntermediate } from './ui.Layout.Intermediate.tsx';

export type ContentProps = {
  breakpoint: t.Breakpoint;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Content: React.FC<ContentProps> = (props) => {
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

  const elMobile = breakpoint.is.mobile && <MobileLayout theme={theme} />;
  const elIntermediate = breakpoint.is.intermediate && <LayoutIntermediate theme={theme} />;
  const elDesktop = breakpoint.is.desktop && <LayoutDesktop theme={theme} />;

  return (
    <div className={css(styles.base, props.style).class}>
      {elNotReady}
      {elMobile}
      {elIntermediate}
      {elDesktop}
    </div>
  );
};
