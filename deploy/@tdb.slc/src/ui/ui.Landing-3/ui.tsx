import React from 'react';
import {
  type t,
  Color,
  css,
  LayoutBreakpoint,
  useKeyboard,
  useSizeObserver,
  VideoBackgroundTubes,
} from './common.ts';
import { Content } from './ui.Content.tsx';

/**
 * Component:
 */
export const Landing: React.FC<t.Landing3Props> = (props) => {
  const { debug = false, backgroundVideoOpacity } = props;

  const size = useSizeObserver();
  const width = size.rect?.width ?? -1;
  const breakpoint = LayoutBreakpoint.from(width);

  /**
   * Hooks:
   */
  useKeyboard();

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
      <Content breakpoint={breakpoint} theme={theme.name} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elBackground}
      {elBody}
    </div>
  );
};
