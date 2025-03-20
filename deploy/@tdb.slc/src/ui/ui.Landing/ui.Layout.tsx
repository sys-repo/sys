import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx, Motion } from './common.ts';

export type LayoutProps = {
  canvas: {
    element?: JSX.Element;
    position?: t.LandingCanvasPosition;
  };
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

type P = LayoutProps;

/**
 * Component:
 */
export const Layout: React.FC<P> = (props) => {
  const { canvas } = props;
  const canvasPosition = canvas.position ?? 'Center:Bottom';

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg }),
    canvas: css({
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) scale(1)',
    }),
  };

  const canvasState =
    canvasPosition === 'Center:Bottom'
      ? { top: 'calc(100% - 10px)', transform: 'translate(-50%, -100%) scale(0.65)' }
      : { top: '50%', transform: 'translate(-50%, -50%) scale(1.1)' };

  const elCanvas = canvas.element && (
    <Motion.div
      className={styles.canvas.class}
      initial={false}
      animate={canvasState}
      transition={{ type: 'spring', stiffness: 200, damping: 10, mass: 0.5 }}
    >
      {canvas.element}
    </Motion.div>
  );

  return <div className={css(styles.base, props.style).class}>{elCanvas}</div>;
};
