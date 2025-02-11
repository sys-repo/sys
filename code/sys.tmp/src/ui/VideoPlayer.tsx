// @ts-types="@types/react"
import React from 'react';

import { useEffect, useRef, useState } from 'react';
import { type t, Color, css, FC, rx } from '../common.ts';

export type VideoPlayerProps = {
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = (props) => {
  const {} = props;

  /**
   * Render
   */
  const t = (ms: t.Msecs, ...attr: string[]) => attr.map((prop) => `${prop} ${ms}ms ease-in-out`);
  const transition = t(50, 'opacity');
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.5)' /* RED */,
      color: theme.fg,
    }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <div>{`🐷 VideoPlayer`}</div>
    </div>
  );
};
