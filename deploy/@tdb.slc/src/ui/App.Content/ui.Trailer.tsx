import React from 'react';
import { type t } from './common.ts';
import { withThemeMethods } from './u.ts';
import { VIDEO } from './VIDEO.index.ts';

export function create() {
  const id: t.Stage = 'Trailer';
  const content: t.AppContent = {
    id,
    video: { src: VIDEO.Trailer.src },
    timestamps: {
      '00:00:00.000': {
        tmp: '1',
        render(props) {
          return <div>👋 Hello Trailer</div>;
        },
      },
      '00:00:02.000': {
        tmp: '2',
        render(props) {
          return <div>👋 Hello Second</div>;
        },
      },
    },
  };
  return withThemeMethods(content);
}
