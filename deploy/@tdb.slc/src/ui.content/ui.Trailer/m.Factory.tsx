import React from 'react';

import { VIDEO } from '../-VIDEO.ts';
import { type t, DEFAULTS } from './common.ts';
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
      video: {
        src: VIDEO.Trailer.src,
        enlargeBy: 2,
        fadeMask: 18,
      },
    },

    render(props) {
      return <Trailer {...props} theme={theme} />;
    },
  };

  return content;
}
