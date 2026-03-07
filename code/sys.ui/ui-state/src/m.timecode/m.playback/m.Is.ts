import { type t } from './common.ts';

export const PlaybackIs: t.PlaybackStateIsLib = {
  terminalEnd(state) {
    const timeline = state.timeline;
    const beatIndex = state.currentBeat;
    if (!timeline || beatIndex == null) return true;

    const i = timeline.segments
      .map((s) => s.beat)
      .findIndex((b) => b.from <= beatIndex && beatIndex < b.to);

    if (i < 0) return true;
    return !timeline.segments[i + 1];
  },
};
