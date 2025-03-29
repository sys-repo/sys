import React from 'react';
import { type t, css, Signal, AppContent } from './common.ts';

type P = t.LayoutMobileProps;

export const LayoutMobile: React.FC<P> = (props) => {
  const { state } = props;
  const p = state?.props;

  Signal.useRedrawEffect(() => {
    state?.listen();
    state?.video.props.currentTime.value;
  });
  if (!p) return null;

  /**
   * Render:
   */
  const styles = {
    base: css({ position: 'relative', display: 'grid' }),
  };

  const el = AppContent.render(state);
  return <div className={css(styles.base, props.style).class}>{el}</div>;
};
