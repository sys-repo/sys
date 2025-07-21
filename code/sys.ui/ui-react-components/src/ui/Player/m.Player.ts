import type { PlayerLib } from './t.ts';

import { Thumbnails } from '../Player.Thumbnails/mod.ts';
import { VideoElement } from '../Player.Video.Element/mod.ts';
import { ElapsedTime, usePlayerSignals, VideoElement2 } from '../Player.Video.Element2/mod.ts';
import { playerSignalsFactory } from '../Player.Video.signals/mod.ts';

export const Player: PlayerLib = {
  Video: {
    signals: playerSignalsFactory,
    Element: VideoElement,
    Element2: VideoElement2,
    useSignals: usePlayerSignals,
  },
  Timestamp: {
    Thumbnails: { View: Thumbnails },
    Elapsed: { View: ElapsedTime },
  },
};
