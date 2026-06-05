import type { t } from './common.ts';

import { PlayerControls as Controls } from '../Player.Video.Controls/mod.ts';
import { VideoDecks as Decks } from '../Player.Video.Decks/mod.ts';
import { ElapsedTime, usePlayerSignals, VideoElement } from '../Player.Video.Element/mod.ts';
import { VideoSignals } from '../Player.Video.Signals/mod.ts';

export const Player: t.PlayerLib = {
  Video: {
    UI: VideoElement,
    Controls,
    Decks,
    Signals: VideoSignals,
    useSignals: usePlayerSignals,
  },
  Timestamp: {
    Elapsed: { UI: ElapsedTime },
  },
};
