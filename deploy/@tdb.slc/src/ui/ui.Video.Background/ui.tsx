import React from 'react';
import { type t, VimeoBackground } from './common.ts';

type P = t.VideoBackgroundProps;

export const VideoBackground: React.FC<P> = (props) => {
  const { state } = props;
  const p = state.props;
  const video = p.background.video;

  /**
   * Render:
   */
  return (
    <VimeoBackground
      video={video.src.value}
      opacity={video.opacity.value}
      theme={p.theme.value}
      style={props.style}
    />
  );
};
