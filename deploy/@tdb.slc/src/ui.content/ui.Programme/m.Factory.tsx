import React from 'react';
import { VIDEO } from '../VIDEO.ts';
import { type t, DEFAULTS, Player } from './common.ts';
import { timestamps } from './m.Factory.timestamps.tsx';
import { ProgrammeRoot } from './ui.tsx';

/**
 * Content: "Programme"
 */
export function factory() {
  const sheetTheme = DEFAULTS.theme.sheet;

  const content: t.VideoContent = {
    id: 'Programme',
    kind: 'VideoContent',

    playOnLoad: false,
    media: {
      timestamps,
      video: Player.Video.signals({
        src: VIDEO.Programme.Intro.About.src,
        fadeMask: { direction: 'Top:Down', size: 10 },
        scale: (e) => e.enlargeBy(2), // NB: enlarge 2px to crop out noise/line at top of video.
      }),
    },
    render(props) {
      return <ProgrammeRoot {...props} theme={sheetTheme} />;
    },
  };
  return content;
}
