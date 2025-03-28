import React from 'react';
import { type t, VIDEO, withThemeMethods } from './common.ts';

export function factory() {
  const id: t.Stage = 'Overview';
  const content: t.AppContent = {
    id,
    video: { src: VIDEO.Overview.src },
    timestamps: {
      '00:00:00.000': {
        tmp: '1',
        render(props) {
          return <div>👋 Hello Overview</div>;
        },
      },
      '00:00:02.000': {
        tmp: '2',
        render(props) {
          return <div>👋 Hello Overview - 2</div>;
        },
      },
    },
  };
  return withThemeMethods(content);
}
