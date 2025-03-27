import React, { useEffect, useRef, useState } from 'react';
import {
  type t,
  Color,
  css,
  Signal,
  DEFAULTS,
  rx,
  useKeyboard,
  VideoBackgroundTubes,
} from './common.ts';

/**
 * Component:
 */
export const Landing: React.FC<t.Landing3Props> = (props) => {
  const { debug = false, backgroundVideoOpacity: backgroundVideo = 0 } = props;

  /**
   * Hooks:
   */
  useKeyboard();

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: debug ? 'rgba(255, 0, 0, 0.1)' : '' /* RED:DEBUG */,
      color: theme.fg,
    }),
    absoluteFill: css({ Absolute: 0 }),
  };

  const elBackground = backgroundVideo !== undefined && (
    <VideoBackgroundTubes opacity={backgroundVideo} style={styles.absoluteFill} />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elBackground}
      <div>{`🐷 Landing-3`}</div>
    </div>
  );
};
