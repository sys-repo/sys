import { type t, Arr, Num } from './common.ts';

/**
 * Helpers:
 */
export function clampBeatIndex(timeline: t.PlaybackTimeline, index: number): t.PlaybackBeatIndex {
  const max = Math.max(0, timeline.beats.length - 1);
  return Num.clamp(0, max, index) as t.PlaybackBeatIndex;
}

export function beatIndexFromVTime(
  timeline: t.PlaybackTimeline,
  vTime: t.Msecs,
): t.PlaybackBeatIndex {
  const beats = timeline.beats;
  if (beats.length === 0) return 0 as t.PlaybackBeatIndex;

  // Find beat where vTime is within [beat.vTime, beat.vTime + duration).
  for (let i = beats.length - 1; i >= 0; i--) {
    const beat = beats[i];
    const from = beat.vTime;
    const to = (beat.vTime + beat.duration) as t.Msecs;
    if (vTime >= from && vTime < to) return beat.index;
  }

  // If vTime is before the first beat, pin to first.
  if (vTime < beats[0].vTime) return beats[0].index;

  // Otherwise beyond end: pin to last.
  return beats[beats.length - 1].index;
}

export function setCurrentBeat(
  prev: t.PlaybackState,
  nextBeat: t.PlaybackBeatIndex,
  io: { cmds: t.PlaybackCmd[]; events: t.PlaybackEvent[] },
): t.PlaybackState {
  const timeline = prev.timeline;
  if (!timeline) return prev;

  const beat = timeline.beats[nextBeat];
  if (!beat) return prev;

  const prevBeat = prev.currentBeat === undefined ? undefined : timeline.beats[prev.currentBeat];
  const prevSeg = prevBeat?.segmentId;
  const nextSeg = beat.segmentId;

  /**
   * Invariant:
   * `segmentId` boundaries must align to media identity, not just beat grouping.
   *
   * Media identity is `url|slice` (slice may be absent). If two adjacent beats
   * refer to different `url|slice`, they MUST have different `segmentId`.
   *
   * This keeps reducer deck swaps (segment boundaries) consistent with runner
   * deck-local time bases (also keyed by `url|slice`).
   */
  let state: t.PlaybackState = { ...prev, currentBeat: nextBeat };

  // Segment boundary => swap decks.
  if (prevSeg !== undefined && prevSeg !== nextSeg) {
    state = swapDecks(state);
    io.cmds.push({ kind: 'cmd:swap-decks' });
  }

  // Always ensure the active deck is loaded + sought to the beat's vTime.
  io.cmds.push({ kind: 'cmd:deck:load', deck: state.decks.active, beat: nextBeat });
  io.cmds.push({ kind: 'cmd:deck:seek', deck: state.decks.active, vTime: beat.vTime });

  return state;
}

function swapDecks(state: t.PlaybackState): t.PlaybackState {
  const active = state.decks.standby;
  const standby = state.decks.active;
  return {
    ...state,
    decks: { ...state.decks, active, standby },
  };
}
