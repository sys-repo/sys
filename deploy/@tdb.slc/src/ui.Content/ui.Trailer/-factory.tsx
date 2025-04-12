import React from 'react';

import { type t, CanvasPanel, DEFAULTS, Player } from '../common.ts';
import { VIDEO } from '../VIDEO.ts';
import { Body } from './ui.Body.tsx';
import { Trailer } from './ui.tsx';

/**
 * Content: "Trailer" (30 second intro).
 */
export function factory() {
  const theme = DEFAULTS.theme.sheet;
  const src = VIDEO.Trailer.src;
  const panels = CanvasPanel.list;

  const content: t.VideoContent = {
    '-type': 'VideoContent',
    id: 'Trailer',
    video: Player.Video.signals({
      src,
      scale: (e) => e.enlarge(2), // NB: enlarge 2px to crop out noise/line at top of video.
    }),
    playOnLoad: false,

    render(props) {
      return <Trailer {...props} theme={theme} />;
    },

    timestamps: {
      '00:00:00.000': (props) => <Body {...props} />,

      '00:00:11.870': (props) => <Body {...props} selected={'purpose'} />,
      '00:00:19.600': (props) => <Body {...props} selected={panels} />,
      '00:00:23.500': (props) => <Body {...props} selected={panels.toReversed()} />,
      '00:00:29.540': (props) => <Body {...props} selected={'purpose'} showLogo={true} />,
    },
  };
  return content;
}
