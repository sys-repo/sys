import React from 'react';
import { VIDEO } from '../VIDEO.ts';
import { type t, DEFAULTS } from './common.ts';
import { DUMMY, v } from './u.ts';
import { ProgrammeRoot } from './ui.tsx';
import { children } from './v.ts';

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
      id: 'programme.root',
      video: v(VIDEO.Programme.Intro.About.src),
      timestamps: {},
      children: [
        ...children,
        // { id: 'start', title: 'Getting Started', video: v(DUMMY), timestamps: {} },
        // { id: 'model.customer', title: 'Customer Model', video: v(DUMMY), timestamps: {} },
        // { id: 'model.impact', title: 'Impact Model', video: v(DUMMY), timestamps: {} },
        // { id: 'model.econ', title: 'Economic Model', video: v(DUMMY), timestamps: {} },
        // { id: 'key-metrics', title: 'Key Metrics', video: v(DUMMY), timestamps: {} },
        // { id: 'conclusion', title: 'Conclusion', video: v(DUMMY), timestamps: {} },
      ],
    },
    render(props) {
      return <ProgrammeRoot {...props} theme={sheetTheme} />;
    },
  };
  return content;
}
