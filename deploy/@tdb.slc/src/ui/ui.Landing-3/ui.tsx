import React from 'react';
import { type t, Color, css, useControllers, useScreensize, VideoBackground } from './common.ts';
import { Content } from './ui.Content.tsx';

type P = t.Landing3Props;

/**
 * Component:
 */
export const Landing: React.FC<P> = (props) => {
  const { debug, state } = props;
  const p = state?.props;

  const size = useScreensize(state);
  const breakpoint = size.breakpoint;
  const isReady = size.ready;

  /**
   * Hooks:
   */
  useControllers(state);

  if (!p) return;
  const bg = p.background;
  const bgVideoOpacity = bg.video.opacity.value;

  /**
   * Render:
   */
  const theme = Color.theme('Dark');
  const styles = {
    base: css({
      color: theme.fg,
      backgroundColor: theme.bg,
      fontFamily: 'sans-serif',
      opacity: isReady ? 1 : 0,
    }),
    fill: css({ Absolute: 0, display: 'grid' }),
  };

  const elBackground = typeof bgVideoOpacity === 'number' && (
    <VideoBackground state={state} style={styles.fill} />
  );

  const elBody = (
    <div ref={size.ref} className={styles.fill.class}>
      <Content breakpoint={breakpoint} state={state} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elBackground}
      {elBody}
    </div>
  );
};
