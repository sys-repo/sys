import React from 'react';

import { VIDEO } from '../VIDEO.ts';
import { type t, DEFAULTS, Player } from './common.ts';
import { timestamps } from './m.Factory.timestamps.tsx';
import { Trailer } from './ui.tsx';

/**
 * Content: "Trailer" (30 second intro).
 */
export function factory() {
  const theme = DEFAULTS.theme.sheet;
  const src = VIDEO.Trailer.src;

  const content: t.VideoContent = {
    '-type': 'VideoContent',
    id: 'Trailer',

    playOnLoad: true,
    video: Player.Video.signals({
      src,
      scale: (e) => e.enlargeBy(2), // NB: enlarge 2px to crop out noise/line at top of video.
    }),

    render: (props) => <Trailer {...props} theme={theme} />,
    timestamps,
  };

  return content;
}
