import React from 'react';
import { type t, VimeoBackground } from './common.ts';

type P = t.VideoBackgroundProps;

export const VideoBackground: React.FC<P> = (props) => {
  const { state } = props;
  const p = state.props;
  const v = p.background.video;
  const opacity = v.opacity.value;
  const src = v.src.value;

  /**
   * Render:
   */
  return <VimeoBackground video={src} opacity={opacity} style={props.style} />;
};
