import React from 'react';

import { VIDEO } from '../VIDEO.ts';
import { type t, CanvasSlug, DEFAULTS, Player } from './common.ts';
import { Overview } from './ui.tsx';

/**
 * Content: "Overview" (2 minute summary).
 */
export function factory() {
  const Slug = CanvasSlug;
  const theme = DEFAULTS.theme.sheet;
  const src = VIDEO.Overview.src;

  const content: t.VideoContent = {
    '-type': 'VideoContent',
    id: 'Overview',
    playOnLoad: false,
    video: Player.Video.signals({
      src,
      scale: (e) => e.enlargeBy(2), // NB: enlarge 2px to crop out noise/line at top of video.
    }),

    render(props) {
      return <Overview {...props} theme={theme} />;
    },

    timestamps: {
      '00:00:00.000': (p) => <Slug {...p} />,
      '00:00:02.300': (p) => <Slug {...p} text={'slow'} />,
      '00:00:03.210': (p) => <Slug {...p} text={'risky'} />,
      '00:00:04.300': (p) => <Slug {...p} text={'mostly\nunsuccessful'} />,
      '00:00:06.350': (p) => <Slug {...p} />,
      '00:00:16.850': (p) => <Slug {...p} text={'business model'} />,
      '00:00:18.580': (p) => <Slug {...p} text={'economic\nfoundation'} />,
      '00:00:23.550': (p) => <Slug {...p} text={'lasting\nmeasuable\nimpact'} />,
      '00:00:36.000': (p) => <Slug {...p} />,
      '00:00:42.000': (p) => <Slug {...p} text={'living dead'} />,
      '00:00:53.000': (p) => <Slug {...p} />,
      '00:01:04.000': (p) => <Slug {...p} logo={'SLC'} />,
    },
  };
  return content;
}
