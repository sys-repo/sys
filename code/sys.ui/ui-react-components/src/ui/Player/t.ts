import type React from 'react';
import type { t } from '../common.ts';

/**
 * Library: Players
 */
export type PlayerLib = {
  Video: {
    UI: t.FC<t.VideoElementProps>;
    Controls: { UI: t.FC<t.PlayerControlsProps> };
    signals: t.PlayerSignalsFactory;
    useSignals: t.UsePlayerSignals;
  };
  Timestamp: {
    Elapsed: { UI: React.FC<t.ElapsedTimeProps> };
  };
};
