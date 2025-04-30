import React from 'react';

import { VIDEO } from '../-VIDEO.ts';
import { type t, DEFAULTS } from './common.ts';
import { v } from './u.ts';
import { Programme } from './ui.tsx';
import { children } from './v.ts';

/**
 * Content: "Programme"
 */
export function factory() {
  /**
   * Content definition:
   */
  const content: t.ProgrammeContent = {
    id: 'Programme',
    kind: 'VideoContent',

    playOnLoad: false,
    media: {
      id: 'programme.root',
      video: v(VIDEO.Programme.Root.src),
      timestamps: {},
      children,
    },

    render(props) {
      const global = props.state;
      return (
        <Programme
          content={content}
          theme={DEFAULTS.theme.sheet}
          isTop={props.is.top}
          onCloseRequest={() => global.stack.pop()}
        />
      );
    },
  };

  return content;
}
