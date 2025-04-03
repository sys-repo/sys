import React from 'react';
import { type t, Color, css, Sheet, VIDEO, AppContent, Button, DEFAULTS } from '../ui.ts';
import { Overview } from './ui.tsx';
import { Body } from './ui.Body.tsx';

/**
 * Content: "Overview" (2 minute summary).
 */
export function factory() {
  const id: t.ContentStage = 'Overview';
  const theme = DEFAULTS.theme.sheet;
  const content: t.Content = {
    id,
    video: { src: VIDEO.Overview.src },

    render(props) {
      return <Overview {...props} theme={theme} />;
    },

    timestamps: {
      '00:00:00.000': {
        render(props) {
          return <Body {...props} theme={theme} />;
        },
      },
    },
  };
  return content;
}
