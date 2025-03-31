import React from 'react';
import { type t, AppContent, css, Signal } from './common.ts';

type P = t.LayoutMobileProps;

export const LayoutMobile: React.FC<P> = (props) => {
  const { state, sheetMargin = 10 } = props;
  const p = state?.props;

  Signal.useRedrawEffect(() => {
    state?.listen();
  });
  if (!p) return null;

  /**
   * Render:
   */
  const styles = {
    base: css({
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: `${sheetMargin}px 1fr ${sheetMargin}px`,
    }),
    center: css({
      position: 'relative',
      display: 'grid',
    }),
  };

  const elStack = AppContent.Render.stack(state);
  const elBody = <div className={styles.center.class}>{elStack}</div>;

  return (
    <div className={css(styles.base, props.style).class}>
      <div />
      {elBody}
      <div />
    </div>
  );
};
