import React from 'react';
import { type t, VimeoBackground, DEFAULTS } from './common.ts';

type P = t.VideoBackgroundProps;

export const VideoBackground: React.FC<P> = (props) => {
  const { state } = props;
  const backgroundVideo = state.props.background.video;
  const opacity = backgroundVideo.opacity.value;
  const src = backgroundVideo.src.value;
  const playing = backgroundVideo.playing.value ?? DEFAULTS.playing;

  /**
   * Render:
   */
  return <VimeoBackground video={src} playing={playing} opacity={opacity} style={props.style} />;
};
