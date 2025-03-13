/**
 * @module
 * "Player" namespace
 *  - Video
 *  - Concept
 *  - Timestamps / Thumbnails
 */
import { type t } from '../common.ts';

import { ConceptPlayer as Concept } from '../Player.Concept/mod.ts';
import { Thumbnails } from '../Player.Thumbnails/mod.ts';
import { VideoPlayer as Video } from '../Player.Video/mod.ts';

export const Player: t.PlayerLib = {
  Concept,
  Video,
  Timestamp: { Thumbnails },
};
