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

  /**
   * Content definition:
   */
  const content: t.ProgrammeContent = {
    id: 'Programme',
    kind: 'VideoContent',
    state: createProgrammeSignals(),

    playOnLoad: false,
    media: {
      id: 'programme.root',
      video: v(VIDEO.Programme.Intro.Entry.src),
      timestamps: {},
      children,
    },

    render(props) {
      const global = props.state;
      return (
        <Programme
          state={content.state}
          theme={sheetTheme}
          isTop={props.is.top}
          onCloseRequest={() => global.stack.pop()}
        />
      );
    },
  };

  /**
   * Setup initial state.
   */
  const p = content.state.props;
  p.media.value = content.media;

  // Finish up.
  return content;
}
