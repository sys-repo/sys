import React from 'react';
import { type t, VimeoBackground } from './common.ts';

type P = t.VideoBackgroundProps;

export const VideoBackground: React.FC<P> = (props) => {
  const { state } = props;
  const video = state.props.background.video;
  const opacity = video.opacity.value;
  const src = video.src.value;

  /**
   * Render:
   */
  return <VimeoBackground video={src} opacity={opacity} style={props.style} />;
};
