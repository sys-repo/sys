import React from 'react';
import { VIDEO } from '../VIDEO.ts';

import { type t, DEFAULTS, Player } from './common.ts';
import { timestamps } from './m.Factory.timestamps.tsx';
import { Overview } from './ui.tsx';

/**
 * Content: "Overview" (2 minute summary).
 */
export function factory() {
  const theme = DEFAULTS.theme.sheet;
  const src = VIDEO.Overview.src;

  const content: t.VideoContent = {
    id: 'Overview',
    kind: 'VideoContent',

    playOnLoad: true,
    video: Player.Video.signals({
      src,
      scale: (e) => e.enlargeBy(2), // NB: enlarge 2px to crop out noise/line at top of video.
      fadeMask: { direction: 'Top:Down', size: 30 },
    }),

    render: (props) => <Overview {...props} theme={theme} />,
    timestamps,
  };
  return content;
}
