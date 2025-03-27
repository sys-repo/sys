import type { t } from './common.ts';

/**
 * Global UI/player signals.
 */
export type SlcSignals = {
  video: t.VideoPlayerSignals;
  stage: t.Signal<t.Stage>;
  dist: t.Signal<t.DistPkg | undefined>;
};
