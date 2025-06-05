import type { PlayerLib } from './t.ts';

import { Thumbnails } from '../Player.Thumbnails/mod.ts';
import { VideoElement } from '../Player.Video.Element/mod.ts';
import { ElapsedTime, VideoPlayer } from '../Player.Video.Vidstack/mod.ts';
import { playerSignalsFactory } from '../Player.Video.signals/mod.ts';

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
