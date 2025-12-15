import type { t } from './common.ts';

/**
 * Create a timeline controller bound to a playback runner.
 *
 * NOTE:
 *    `init()` must be called before play/pause/toggle have effect.
 *    This mirrors the playback machine lifecycle.
 */
export function createTimelineController(runner: t.PlaybackRunner): t.TimelineController {
  return {
    init(timeline, startBeat) {
      runner.send({ kind: 'playback:init', timeline, startBeat });
    },

    play() {
      runner.send({ kind: 'playback:play' });
    },

    pause() {
      runner.send({ kind: 'playback:pause' });
    },

    toggle() {
      const { intent } = runner.get();
      runner.send(intent === 'play' ? { kind: 'playback:pause' } : { kind: 'playback:play' });
    },

    seekToBeat(index) {
      runner.send({ kind: 'playback:seek:beat', beat: index });
    },
  };
}
