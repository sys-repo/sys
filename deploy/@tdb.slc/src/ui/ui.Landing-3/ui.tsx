import React, { useEffect } from 'react';
import {
  type t,
  Color,
  css,
  Layout,
  pkg,
  useDist,
  useSizeObserver,
  VideoBackground,
} from './common.ts';
import { Content } from './ui.Content.tsx';

type P = t.Landing3Props;

/**
 * Component:
 */
export const Landing: React.FC<P> = (props) => {
  const { debug, state } = props;
  const p = state?.props;

  const size = useSizeObserver();
  const width = size.rect?.width ?? -1;
  const breakpoint = Layout.Breakpoint.fromWidth(width);

  /**
   * Hooks:
   */
  const dist = useDist({
    useSampleFallback: wrangle.showSampleDist(props),
  });

  /**
   * Effects:
   */
  useEffect(() => {
    console.info(`💦 ${pkg.name}@${pkg.version}: dist.json →`, dist.json);
    if (state) state.props.dist.value = dist.json;
  }, [dist.count, !!state]);

  useEffect(() => {
    if (!p) return;
    p.screen.breakpoint.value = breakpoint.name;
  }, [breakpoint.name]);

  if (!p) return;
  const bg = p.background;
  const backgroundVideoOpacity = bg.video.opacity.value;

  /**
   * Render:
   */
  const theme = Color.theme('Dark');
  const styles = {
    base: css({ backgroundColor: theme.bg, color: theme.fg, fontFamily: 'sans-serif' }),
    fill: css({ Absolute: 0, display: 'grid' }),
  };

  const elBackground = typeof backgroundVideoOpacity === 'number' && (
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

/**
 * Helpers
 */
const wrangle = {
  showSampleDist(props: P) {
    const { debug } = props;
    const isLocalhost = location.hostname === 'localhost';
    return debug ?? (isLocalhost && location.port !== '8080');
  },
} as const;
