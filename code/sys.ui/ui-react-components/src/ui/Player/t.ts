import type React from 'react';
import type { t } from '../common.ts';

/**
 * Library: Players
 */
export type PlayerLib = {
  readonly Video: {
    readonly UI: t.FC<t.VideoElementProps>;
    readonly Controls: { readonly UI: t.FC<t.PlayerControlsProps> };
    readonly Signals: t.VideoPlayerSignalsLib;
    readonly signals: t.PlayerSignalsFactory;
    readonly useSignals: t.UsePlayerSignals;
  };
  readonly Timestamp: {
    readonly Elapsed: { readonly UI: React.FC<t.ElapsedTimeProps> };
  };
};
