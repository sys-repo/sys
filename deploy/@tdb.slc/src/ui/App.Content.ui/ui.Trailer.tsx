import React from 'react';
import { type t, VIDEO, withThemeMethods } from './common.ts';

export function factory() {
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
