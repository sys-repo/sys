import React from 'react';
import { VIDEO } from '../VIDEO.ts';
import { type t, DEFAULTS, Player } from './common.ts';
import { ProgrammeRoot } from './ui.tsx';

/**
 * Content: "Programme"
 */
export function factory() {
  const sheetTheme = DEFAULTS.theme.sheet;

  const DUMMY = VIDEO.Programme.Intro.About.src; // TEMP 🐷
  const v = (src: string) =>
    Player.Video.signals({
      src,
      fadeMask: 10,
      scale: (e) => e.enlargeBy(2),
    });

  const timestamps = {};

  const content: t.VideoContent = {
    id: 'Programme',
    kind: 'VideoContent',

    playOnLoad: false,
    media: {
      id: 'programme.root',
      video: v(VIDEO.Programme.Intro.About.src),
      timestamps: {},
      children: [
        { id: 'start', title: 'Getting Started', video: v(DUMMY), timestamps },
        { id: 'model.customer', title: 'Customer Model', video: v(DUMMY), timestamps },
        { id: 'model.impact', title: 'Impact Model', video: v(DUMMY), timestamps },
        { id: 'model.econ', title: 'Economic Model', video: v(DUMMY), timestamps },
        { id: 'key-metrics', title: 'Key Metrics', video: v(DUMMY), timestamps },
        { id: 'conclusion', title: 'Conclusion', video: v(DUMMY), timestamps },
      ],
    },
    render(props) {
      return <ProgrammeRoot {...props} theme={sheetTheme} />;
    },
  };
  return content;
}
