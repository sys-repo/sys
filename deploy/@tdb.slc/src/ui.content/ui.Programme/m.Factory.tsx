import React from 'react';

import { VIDEO } from '../VIDEO.ts';
import { type t, DEFAULTS } from './common.ts';
import { createProgrammeSignals } from './m.Signals.ts';
import { v } from './u.ts';
import { Programme } from './ui.tsx';
import { children } from './v.ts';

/**
 * Content: "Programme"
 */
export function factory() {
  const sheetTheme = DEFAULTS.theme.sheet;
  const state = createProgrammeSignals();

  const content: t.ProgrammeContent = {
    id: 'Programme',
    kind: 'VideoContent',
    state,

    playOnLoad: false,
    media: {
      id: 'programme.root',
      video: v(VIDEO.Programme.Intro.Entry.src),
      timestamps: {},
      children,
    },

    render(props) {
      const global = props.state;
      const component = content.state;
      const state = { component };
      return (
        <Programme
          state={state}
          theme={sheetTheme}
          isTop={props.is.top}
          onCloseRequest={() => global.stack.pop()}
        />
      );
    },
  };

  state.props.media.value = content.media;
  return content;
}
