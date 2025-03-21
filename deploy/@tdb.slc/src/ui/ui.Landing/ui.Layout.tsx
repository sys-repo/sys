import React from 'react';
import { type t, Color, css, DEFAULTS, Motion } from './common.ts';

export type LayoutProps = {
  canvas: { element?: JSX.Element; position?: t.LandingCanvasPosition };
  video: { element?: JSX.Element };
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

type P = LayoutProps;

/**
 * Component:
 */
export const Layout: React.FC<P> = (props) => {
  const { canvas, video } = props;
  const position = canvas.position ?? DEFAULTS.canvasPosition;

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

    video: css({
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '85%',
      aspectRatio: '16/9',
      backgroundColor: 'white',
      borderRadius: 15,
      overflow: 'hidden',
      display: position === 'Center:Bottom' ? 'grid' : 'none',
    }),
  };

  /**
   * Animation state:
   */
  const canvasState =
    position === 'Center:Bottom'
      ? { top: 'calc(100% - 10px)', transform: 'translate(-50%, -100%) scale(0.65)' }
      : { top: '50%', transform: 'translate(-50%, -50%) scale(1.1)' };

  const backgroundAnimate =
    position === 'Center:Bottom'
      ? { opacity: 1, top: '50%', transform: 'translate(-50%, calc(-50% - 80px))' }
      : { opacity: 0, top: '50%', transform: 'translate(-50%, calc(-50% - 80px))' };

  /**
   * Elements:
   */
  const elVideo = (
    <Motion.div
      className={styles.video.class}
      initial={false} // Prevent initial animation on mount.
      animate={backgroundAnimate}
      transition={{ type: 'spring', stiffness: 200, damping: 15, mass: 0.8 }}
    >
      {video.element}
    </Motion.div>
  );

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

  return (
    <div className={css(styles.base, props.style).class}>
      {elVideo}
      {elCanvas}
    </div>
  );
};
