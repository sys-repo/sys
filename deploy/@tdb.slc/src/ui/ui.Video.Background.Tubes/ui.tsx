import React from 'react';
import { type t, VimeoBackground } from './common.ts';

type P = t.VideoBackgroundTubesProps;
const TUBES = { id: 499921561 };

export const VideoBackgroundTubes: React.FC<P> = (props) => {
  /**
   * Render:
   */
  return (
    <VimeoBackground
      video={TUBES.id}
      opacity={props.opacity}
      theme={props.theme}
      style={props.style}
    />
  );
};
