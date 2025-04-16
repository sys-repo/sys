import React from 'react';
import { VIDEO } from '../VIDEO.ts';

import { type t, DEFAULTS, Player } from './common.ts';
import { timestamps } from './u.timestamps.tsx';
import { Overview } from './ui.tsx';

/**
 * Content: "Overview" (2 minute summary).
 */
export function factory() {
  const theme = DEFAULTS.theme.sheet;
  const src = VIDEO.Overview.src;

  const content: t.VideoContent = {
    '-type': 'VideoContent',

    id: 'Overview',
    playOnLoad: true,
    video: Player.Video.signals({
      src,
      scale: (e) => e.enlargeBy(2), // NB: enlarge 2px to crop out noise/line at top of video.
    }),
    render: (props) => <Overview {...props} theme={theme} />,
    timestamps,
  };
  return content;
}
