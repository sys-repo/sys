import type { PlayerLib } from './t.ts';

import { Thumbnails } from '../Player.Thumbnails/mod.ts';
import { ElapsedTime, VideoPlayer, playerSignalsFactory } from '../Player.Video/mod.ts';
import { VideoElement } from '../Player.Video.Element/mod.ts';

export const Player: PlayerLib = {
  Video: {
    signals: playerSignalsFactory,
    View: VideoPlayer,
    Element: VideoElement,
  },
  Timestamp: {
    Thumbnails: { View: Thumbnails },
    Elapsed: { View: ElapsedTime },
  },
};
