import type { t } from './common.ts';
import { toTimeline } from './u.toTimeline.ts';

/**
 * Public experience library.
 */
export const Experience: t.Timecode.Experience.Lib = Object.freeze({
  toTimeline,
});
