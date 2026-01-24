import type { t } from './common.ts';

import { ElapsedTime, usePlayerSignals, VideoElement } from '../Player.Video.Element/mod.ts';
import { VideoSignals } from '../Player.Video.Signals/mod.ts';
import { PlayerControls } from '../Player.Video.Controls/mod.ts';

export const Player: t.PlayerLib = {
  Video: {
    UI: VideoElement,
    Controls: { UI: PlayerControls },
    Signals: VideoSignals,
    signals: VideoSignals.create,
    useSignals: usePlayerSignals,
  },
  Timestamp: {
    Elapsed: { UI: ElapsedTime },
  },
};
