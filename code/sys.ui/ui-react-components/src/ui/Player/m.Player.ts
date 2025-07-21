import type { PlayerLib } from './t.ts';

import { Thumbnails } from '../Player.Thumbnails/mod.ts';
import { VideoElement__OLD } from '../Player.Video.Element__OLD/mod.ts';
import { ElapsedTime, usePlayerSignals, VideoElement } from '../Player.Video.Element/mod.ts';
import { playerSignalsFactory } from '../Player.Video.signals/mod.ts';

export const Player: PlayerLib = {
  Video: {
    Element__OLD: VideoElement__OLD,

    View: VideoElement,
    signals: playerSignalsFactory,
    useSignals: usePlayerSignals,
  },
  Timestamp: {
    Thumbnails: { View: Thumbnails },
    Elapsed: { View: ElapsedTime },
  },
};
