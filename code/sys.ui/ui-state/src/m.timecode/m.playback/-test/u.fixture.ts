import type { t } from '../common.ts';

export function emptyState(): t.PlaybackState {
  return {
    phase: 'idle',
    intent: 'stop',
    timeline: undefined,
    currentBeat: undefined,
    error: undefined,
    decks: {
      active: 'A',
      standby: 'B',
      status: { A: 'empty', B: 'empty' },
    },
    ready: { machine: false, runner: false },
  };
}

export function beat(index: number, vTime: number, duration = 1000): t.PlaybackBeat {
  return {
    index: index,
    vTime: vTime,
    duration: duration,
    segmentId: 'seg:test',
  };
}

export function timeline(): t.PlaybackTimeline {
  return {
    beats: [beat(0, 0), beat(1, 1000), beat(2, 2000)],
    segments: [{ id: 'seg:test', beat: { from: 0, to: 3 } }],
    virtualDuration: 3000,
  };
}
