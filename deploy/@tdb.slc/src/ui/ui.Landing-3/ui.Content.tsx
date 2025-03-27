import React from 'react';
import { type t, css, MobileLayout } from './common.ts';

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

  const elMobile = breakpoint.is.mobile && <MobileLayout style={styles.layout} theme={theme} />;

  const elIntermediate = breakpoint.is.intermediate && (
    <div className={styles.layout.class}>intermediateContentLayout</div>
  );
  const elDesktop = breakpoint.is.desktop && (
    <div className={styles.layout.class}>desktopContentLayout</div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elNotReady}
      {elMobile}
      {elIntermediate}
      {elDesktop}
    </div>
  );
};
