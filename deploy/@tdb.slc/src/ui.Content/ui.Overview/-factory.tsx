import React from 'react';

import { VIDEO } from '../VIDEO.ts';
import { type t, CanvasSlug, DEFAULTS, Player } from './common.ts';
import { Overview } from './ui.tsx';

/**
 * Content: "Overview" (2 minute summary).
 */
export function factory() {
  const id: t.ContentStage = 'Overview';
  const theme = DEFAULTS.theme.sheet;

  const content: t.VideoContent = {
    '-type': 'VideoContent',
    id,
    video: Player.Video.signals(VIDEO.Overview.src),
    playOnLoad: true,

    render(props) {
      return <Overview {...props} theme={theme} />;
    },

    timestamps: {
      '00:00:00.000': (props) => <CanvasSlug {...props} logo={'SLC'} />,
    },
  };
  return content;
}
