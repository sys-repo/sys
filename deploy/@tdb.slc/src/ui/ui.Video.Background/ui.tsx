import React from 'react';
import { type t, VIDEO, VimeoBackground } from './common.ts';

type P = t.VideoBackgroundProps;

export const VideoBackground: React.FC<P> = (props) => {
  /**
   * Render:
   */
  return (
    <VimeoBackground
      video={wrangle.src(props)}
      opacity={props.opacity}
      theme={props.theme}
      style={props.style}
    />
  );
};

/**
 * Helpers
 */
const wrangle = {
  src(props: P) {
    const { kind = 'Tubes' } = props;
    if (kind === 'Tubes') return VIDEO.Tubes.id;
    throw new Error(`Background video kind "${kind}" not supported.`);
  },
} as const;
