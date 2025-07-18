import type { PlayerLib } from './t.ts';

import { Thumbnails } from '../Player.Thumbnails/mod.ts';
import { VideoElement } from '../Player.Video.Element/mod.ts';
import { VideoElement2, usePlayerSignals } from '../Player.Video.Element2/mod.ts';
import { ElapsedTime, VideoPlayer } from '../Player.Video.Vidstack/mod.ts';
import { playerSignalsFactory } from '../Player.Video.signals/mod.ts';

export const Player: PlayerLib = {
  Video: {
    signals: playerSignalsFactory,
    Vidstack: VideoPlayer,
    Element: VideoElement,
    Element2: VideoElement2,
    useSignals: usePlayerSignals,
  },
  Timestamp: {
    Thumbnails: { View: Thumbnails },
    Elapsed: { View: ElapsedTime },
  },
};
