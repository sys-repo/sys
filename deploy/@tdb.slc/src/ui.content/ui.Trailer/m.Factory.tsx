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

  const content: t.VideoContent = {
    id: 'Trailer',
    kind: 'VideoContent',

    playOnLoad: true,
    media: {
      id: 'trailer.root',
      timestamps,
      video: Player.Video.signals({
        src: VIDEO.Trailer.src,
        scale: (e) => e.enlargeBy(2), // NB: enlarge 2px to crop out noise/line at top of video.
        fadeMask: { direction: 'Top:Down', size: 18 },
      }),
    },

    render(props) {
      return <Trailer {...props} theme={theme} />;
    },
  };

  return content;
}
