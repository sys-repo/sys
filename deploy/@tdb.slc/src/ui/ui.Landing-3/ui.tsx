import React from 'react';
import {
  type t,
  Color,
  css,
  LayoutBreakpoint,
  useDist,
  useKeyboard,
  useSizeObserver,
  VideoBackgroundTubes,
} from './common.ts';
import { Content } from './ui.Content.tsx';

type P = t.Landing3Props;

/**
 * Component:
 */
export const Landing: React.FC<P> = (props) => {
  const { debug, backgroundVideoOpacity } = props;

  const size = useSizeObserver();
  const width = size.rect?.width ?? -1;
  const breakpoint = LayoutBreakpoint.from(width);

  /**
   * Hooks:
   */
  useKeyboard();
  const dist = useDist({ sample: wrangle.showSample(props) });
  console.info('💦 dist.json:', dist);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ backgroundColor: theme.bg, color: theme.fg, fontFamily: 'sans-serif' }),
    fill: css({ Absolute: 0, display: 'grid' }),
  };

  const elBackground = typeof backgroundVideoOpacity === 'number' && (
    <VideoBackgroundTubes opacity={backgroundVideoOpacity} style={styles.fill} />
  );

  const elBody = (
    <div ref={size.ref} className={styles.fill.class}>
      <Content breakpoint={breakpoint} theme={theme.name} dist={dist} />
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
  showSample(props: P) {
    const { debug } = props;
    const isLocalhost = location.hostname === 'localhost';
    return debug ?? (isLocalhost && location.port !== '8080');
  },
} as const;
