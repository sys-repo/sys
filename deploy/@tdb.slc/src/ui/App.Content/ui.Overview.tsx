import React from 'react';
import { type t } from './common.ts';
import { withThemeMethods } from './u.ts';
import { VIDEO } from './VIDEO.index.ts';

export function create() {
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
