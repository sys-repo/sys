import { type t } from '../common.ts';

import { ConceptPlayer } from '../Player.Concept/mod.ts';
import { Thumbnails } from '../Player.Thumbnails/mod.ts';
import { VideoPlayer, playerSignalsFactory, ElapsedTime } from '../Player.Video/mod.ts';

export const Player: t.PlayerLib = {
  Concept: {
    View: ConceptPlayer,
  },
  Video: {
    View: VideoPlayer,
    signals: playerSignalsFactory,
  },
  Timestamp: {
    Thumbnails: { View: Thumbnails },
    Elapsed: { View: ElapsedTime },
  },
};
