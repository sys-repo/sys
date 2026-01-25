import type React from 'react';
import type { t } from '../common.ts';

/**
 * Library: Players
 */
export type PlayerLib = {
  readonly Video: {
    readonly UI: t.FC<t.VideoElementProps>;
    readonly Controls: t.PlayerControlsLib;
    readonly Signals: t.VideoPlayerSignalsLib;
    readonly signals: t.PlayerSignalsFactory;
    readonly useSignals: t.UsePlayerSignals;
  };
  readonly Timestamp: {
    readonly Elapsed: {
      readonly UI: React.FC<t.ElapsedTimeProps>;
    };
  };
};
