import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PlayerControls } from '../Player.Video.Controls/mod.ts';

import { type t, Str, Color, css, M, READY_STATE } from './common.ts';
import { useAutoplay } from './use.AutoPlay.ts';
import { useControlsVisible } from './use.ControlsVisible.ts';

export type DebugProps = {
  readyState?: t.NumberMediaReadyState;
  playing?: boolean;
  seeking?: boolean;
  src?: string;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { readyState, playing, seeking } = props;

  let src = props.src ?? '';
  src = src ? src?.slice(-8) : '';
  src = `“...${src}”`;

  let text = '';
  text += `ready-state=${readyState}, `;
  text += `playing=${playing}, `;
  text += `seeking=${seeking}, `;
  text += `src=${src} `;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      fontSize: 11,
      color: Color.alpha(Color.DARK, 0.6),
      backgroundColor: Color.alpha(Color.WHITE, 0.5),
      backdropFilter: 'blur(1.5px)',
      Padding: [1, 5],
      borderRadius: 2,
      userSelect: 'none',
    }),
  };

  return <div className={css(styles.base, props.style).class}>{text}</div>;
};
