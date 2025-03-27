import React from 'react';
import {
  type t,
  Breakpoint,
  Color,
  css,
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
  const { debug, signals, backgroundVideoOpacity } = props;

  const size = useSizeObserver();
  const width = size.rect?.width ?? -1;
  const breakpoint = Breakpoint.from(width);

  /**
   * Hooks:
   */
  useKeyboard({ signals });
  const dist = useDist({
    useSample: wrangle.showSample(props),
    onChanged(e) {
      if (signals) signals.dist.value = e.dist;
      console.info('💦 ./dist.json:', dist);
    },
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.signals?.theme.value);
  const styles = {
    base: css({ backgroundColor: theme.bg, color: theme.fg, fontFamily: 'sans-serif' }),
    fill: css({ Absolute: 0, display: 'grid' }),
  };

  const elBackground = typeof backgroundVideoOpacity === 'number' && (
    <VideoBackgroundTubes opacity={backgroundVideoOpacity} style={styles.fill} />
  );

  const elBody = (
    <div ref={size.ref} className={styles.fill.class}>
      <Content breakpoint={breakpoint} signals={signals} />
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
