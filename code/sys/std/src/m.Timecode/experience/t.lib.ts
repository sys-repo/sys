import type { t } from './common.ts';

/**
 * Public library surface for building experience timelines.
 */
export type TimecodeExperienceLib = {
  /**
   * Project source-anchored beats onto a resolved composite timeline.
   * Returns a stable, ordered timeline and total virtual duration.
   */
  readonly toTimeline: <P>(
    resolved: t.TimecodeCompositionResolved,
    beats: readonly t.TimecodeExperienceBeat<P>[],
  ) => t.TimecodeTimeline<P>;
};
