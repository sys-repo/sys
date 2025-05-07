import { type t } from '../common.ts';

import { Thumbnails } from '../Player.Thumbnails/mod.ts';
import { ElapsedTime, VideoPlayer, playerSignalsFactory } from '../Player.Video/mod.ts';

export const Player: t.PlayerLib = {
  Video: {
    View: VideoPlayer,
    signals: playerSignalsFactory,
  },
  Timestamp: {
    Thumbnails: { View: Thumbnails },
    Elapsed: { View: ElapsedTime },
  },
};
