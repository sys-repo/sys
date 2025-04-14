import React from 'react';

import { VIDEO } from '../VIDEO.ts';
import { type t, CanvasPanel, CanvasSlug, DEFAULTS, Player } from './common.ts';
import { Trailer } from './ui.tsx';

/**
 * Content: "Trailer" (30 second intro).
 */
export function factory() {
  const theme = DEFAULTS.theme.sheet;
  const src = VIDEO.Trailer.src;
  const panels = CanvasPanel.list;
  const Slug = CanvasSlug;

  const content: t.VideoContent = {
    '-type': 'VideoContent',
    id: 'Trailer',

    playOnLoad: true,
    video: Player.Video.signals({
      src,
      scale: (e) => e.enlargeBy(2), // NB: enlarge 2px to crop out noise/line at top of video.
    }),

    render(props) {
      return <Trailer {...props} theme={theme} />;
    },

    timestamps: {
      '00:00:00.000': (p) => <Slug {...p} logo={'SLC'} />,
      '00:00:00.001': (p) => <Slug {...p} text={'👋'} />,
      '00:00:03.560': (p) => <Slug {...p} text={'ideas'} />,
      '00:00:07.000': (p) => <Slug {...p} text={'priority'} />,

      '00:00:11.870': (p) => <Slug {...p} selected={'purpose'} text={'purpose'} />,
      '00:00:19.600': (p) => <Slug {...p} selected={panels} text={'decompose'} />,
      '00:00:23.500': (p) => <Slug {...p} selected={panels.toReversed()} text={'recompose'} />,
      '00:00:29.540': (p) => <Slug {...p} selected={'purpose'} logo={'SLC'} />,
      '00:00:34.000': (p) => <Slug {...p} selected={'purpose'} text={'coherence'} />,
      '00:00:37.590': (p) => <Slug {...p} selected={'purpose'} logo={'SLC'} />,
      '00:00:47.350': (p) => <Slug {...p} selected={'purpose'} text={'shared clarity'} />,
      '00:00:55.620': (p) => <Slug {...p} selected={'purpose'} logo={'CC'} />,
      '00:00:59.000': (p) => <Slug {...p} selected={'purpose'} logo={'SLC'} />,
    },
  };

  return content;
}
