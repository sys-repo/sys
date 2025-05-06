import React from 'react';
import { VIDEO } from '../-VIDEO.ts';

import { type t, App, DEFAULTS, Player } from './common.ts';
import { timestamps } from './m.Factory.timestamps.tsx';
import { Overview } from './ui.tsx';

/**
 * Content: "Overview" (2 minute summary).
 */
export function factory() {
  const theme = DEFAULTS.theme.sheet;

  const content: t.VideoContent = {
    id: 'Overview',
    kind: 'VideoContent',

    playOnLoad: true,
    media: {
      id: 'overview.root',
      timestamps,
      video: Player.Video.signals({
        src: VIDEO.Overview.src,
        scale: (e) => e.enlargeBy(2), // NB: enlarge 2px to crop out noise/line at top of video.
        fadeMask: 20,
      }),
    },

    render(props) {
      return <Overview {...props} theme={theme} />;
    },
  };

  App.Render.preloadTimestamps(content.media);
  return content;
}
