import type React from 'react';
import type { t } from '../common.ts';

/**
 * Library: Players
 */
export type PlayerLib = {
  readonly Video: {
    readonly UI: t.FC<t.VideoElementProps>;
    readonly Controls: t.VideoPlayerControlsLib;
    readonly Decks: t.VideoDecksLib;
    readonly Signals: t.VideoPlayerSignalsLib;
    readonly useSignals: t.UsePlayerSignals;
  };
  readonly Timestamp: {
    readonly Elapsed: {
      readonly UI: React.FC<t.ElapsedTimeProps>;
    };
  };
};
