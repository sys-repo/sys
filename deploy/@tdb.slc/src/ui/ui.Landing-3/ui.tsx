import React, { useEffect, useRef, useState } from 'react';
import {
  type t,
  Color,
  css,
  Style,
  Signal,
  DEFAULTS,
  rx,
  useKeyboard,
  VideoBackgroundTubes,
  Cropmarks,
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
    base: css({ backgroundColor: theme.bg, color: theme.fg, fontFamily: 'sans-serif' }),
    absoluteFill: css({ Absolute: 0, display: 'grid' }),
  };

  const elBackground = backgroundVideo !== undefined && (
    <VideoBackgroundTubes opacity={backgroundVideo} style={styles.absoluteFill} />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elBackground}
      <div className={styles.absoluteFill.class}>
        <Cropmarks theme={theme.name}>
          <div>{`🐷 Landing-3`}</div>
        </Cropmarks>
      </div>
    </div>
  );
};
