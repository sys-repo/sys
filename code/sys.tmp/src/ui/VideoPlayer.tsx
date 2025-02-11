// @ts-types="@types/react"
import React from 'react';

import { type t, pkg, Pkg, Color } from '../common.ts';

export type VideoPlayerProps = {
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = (props) => {
  const {} = props;

  return (
    <div style={{ backgroundColor: Color.RUBY }}>
      <div>{`🐷 VideoPlayer: ${Pkg.toString(pkg)}`}</div>
    </div>
  );
};
