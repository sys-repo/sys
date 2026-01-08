import type { t } from './common.ts';

/**
 * Create a timeline controller bound to a playback runner.
 *
 * Responsibilities:
 * - Translate UI intent into runner inputs
 * - Use runner.get() for authoritative reads (toggle correctness)
 *
 * Non-responsibilities:
 * - No runtime/media access
 * - No scheduling
 * - No state ownership
 */
export function createTimelineController(runner: t.PlaybackRunner): t.TimelineController {
  return {
    init: (timeline, startBeat) => runner.send({ kind: 'playback:init', timeline, startBeat }),
    play: () => runner.send({ kind: 'playback:play' }),
    pause: () => runner.send({ kind: 'playback:pause' }),
    seekToBeat: (index) => runner.send({ kind: 'playback:seek:beat', beat: index }),
    toggle() {
      const { intent } = runner.get();
      runner.send(intent === 'play' ? { kind: 'playback:pause' } : { kind: 'playback:play' });
    },
  };
}
