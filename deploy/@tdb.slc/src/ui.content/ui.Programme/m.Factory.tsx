import React from 'react';
import { VIDEO } from '../VIDEO.ts';
import { type t, DEFAULTS } from './common.ts';
import { v } from './u.ts';
import { ProgrammeRoot } from './ui.tsx';
import { children } from './v.ts';
import { createProgrammeSignals } from './m.Signals.ts';

/**
 * Content: "Programme"
 */
export function factory() {
  const sheetTheme = DEFAULTS.theme.sheet;
  const component = createProgrammeSignals();

  const content: t.VideoContent = {
    id: 'Programme',
    kind: 'VideoContent',

    playOnLoad: false,
    media: {
      id: 'programme.root',
      video: v(VIDEO.Programme.Intro.About.src),
      timestamps: {},
      children,
    },

    render(props) {
      const global = props.state;
      return (
        <ProgrammeRoot
          state={{ global, component }}
          content={content}
          theme={sheetTheme}
          isTop={props.is.top}
        />
      );
    },
  };
  return content;
}
