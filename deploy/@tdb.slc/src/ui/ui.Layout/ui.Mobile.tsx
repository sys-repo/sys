import React from 'react';
import { type t, App, css, Signal } from './common.ts';

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
  const styles = {
    base: css({ position: 'relative', display: 'grid' }),
  };

  /**
   * The stack of sheets.
   */
  const elStack = App.Render.stack(state);
  return <div className={css(styles.base, props.style).class}>{elStack}</div>;
};
