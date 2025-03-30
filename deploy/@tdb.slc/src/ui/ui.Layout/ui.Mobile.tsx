import React from 'react';
import { type t, css, Signal, AppContent } from './common.ts';

type P = t.LayoutMobileProps;

export const LayoutMobile: React.FC<P> = (props) => {
  const { state } = props;
  const p = state?.props;

  Signal.useRedrawEffect(() => {
    state?.listen();
  });
  if (!p) return null;

  /**
   * Render:
   */
  const style = css({ position: 'relative', display: 'grid' });
  const elStack = AppContent.Render.stack(state);
  return <div className={css(style, props.style).class}>{elStack}</div>;
};
