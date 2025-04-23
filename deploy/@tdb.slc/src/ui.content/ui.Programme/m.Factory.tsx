import React from 'react';
import { VIDEO } from '../VIDEO.ts';
import { type t, DEFAULTS } from './common.ts';
import { v } from './u.ts';
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
      children,
    },

    render(props) {
      return <ProgrammeRoot {...props} theme={sheetTheme} />;
    },
  };
  return content;
}
