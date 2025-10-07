import type { t } from './common.ts';

import { Thumbnails } from '../Player.Thumbnails/mod.ts';
import { ElapsedTime, usePlayerSignals, VideoElement } from '../Player.Video.Element/mod.ts';
import { playerSignalsFactory } from '../Player.Video.signals/mod.ts';

export const Player: t.PlayerLib = {
  Video: {
    Element: VideoElement,
    signals: playerSignalsFactory,
    useSignals: usePlayerSignals,
  },
  Timestamp: {
    Thumbnails: { View: Thumbnails },
    Elapsed: { View: ElapsedTime },
  },
};
