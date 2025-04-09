import React from 'react';
import { type t, DEFAULTS } from '../common.ts';
import { VIDEO } from '../VIDEO.ts';
import { Trailer } from './ui.tsx';

/**
 * Content: "Trailer" (30 second intro).
 */
export function factory() {
  const theme = DEFAULTS.theme.sheet;

  const content: t.VideoContent = {
    id: 'Trailer',
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
          return <div>{`props.timestamp (1): ${props.timestamp}`}</div>;
        },
      },
      '00:00:12.000': {
        render(props) {
          return <div>{`props.timestamp (2): ${props.timestamp}`}</div>;
        },
      },
    },
  };
  return content;
}
