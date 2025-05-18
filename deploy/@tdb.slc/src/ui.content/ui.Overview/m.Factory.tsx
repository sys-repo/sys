import React from 'react';
import { VIDEO } from '../-VIDEO.ts';

import { type t, App, DEFAULTS, v } from './common.ts';
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
      video: v(VIDEO.Overview.src),
    },

    render(props) {
      return <Overview {...props} theme={theme} />;
    },
  };

  App.Render.preloadTimestamps(content.media);
  return content;
}
