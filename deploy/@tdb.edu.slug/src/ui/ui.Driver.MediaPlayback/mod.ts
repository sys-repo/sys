/**
 * @module
 * MediaPlaybackDriver
 * Thin driver head that reuses `TreeContentDriver` core orchestration.
 */
import { type t, TreeContentDriver } from './common.ts';
import { MediaPlaybackHead } from './m.head.ts';

export const MediaPlaybackDriver: t.MediaPlaybackDriver.Lib = {
  orchestrator: TreeContentDriver.orchestrator,
  head: MediaPlaybackHead,
};
