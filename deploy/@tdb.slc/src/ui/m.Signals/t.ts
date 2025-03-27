import type { t } from './common.ts';

/**
 * Global UI/player signals.
 */
export type SlcSignals = {
  stage: t.Signal<t.Stage>;
  video: t.VideoPlayerSignals;
};
