import React from 'react';
import { type t, DEFAULTS, VIDEO } from '../ui.ts';
import { Body } from './ui.Body.tsx';
import { Trailer } from './ui.tsx';

/**
 * Content: "Trailer" (30 second intro).
 */
export function factory() {
  const id: t.ContentStage = 'Trailer';
  const theme = DEFAULTS.theme.sheet;

  const content: t.Content = {
    id,
    video: { src: VIDEO.Trailer.src },

    /**
     * Base component:
     */
    render(props) {
      return <Trailer {...props} theme={theme} />;
    },

    /**
     * Timestamps:
     */
    timestamps: {
      '00:00:00.000': {
        render(props) {
          return <Body {...props} theme={theme} />;
        },
      },
      '00:00:12.000': {
        render(props) {
          return <Body {...props} theme={theme} />;
        },
      },
    },
  };
  return content;
}
