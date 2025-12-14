import { type t } from './common.ts';
import { clampBeatIndex, setCurrentBeat } from './u.ts';

/**
 * Create initial playback state and side-effect intents from optional inputs.
 */
export const init: t.PlaybackStateLib['init'] = (args = {}) => {
  const { timeline, startBeat } = args;

  const decks: t.PlaybackState['decks'] = {
    active: 'A',
    standby: 'B',
    status: { A: 'empty', B: 'empty' },
  };

  const state: t.PlaybackState = {
    phase: timeline ? 'active' : 'idle',
    intent: 'stop',
    timeline,
    currentBeat: undefined,
    decks,
    ready: { machine: true },
    error: undefined,
  };

  const cmds: t.PlaybackCmd[] = [];
  const events: t.PlaybackEvent[] = [];

  // If timeline is present, seed beat + load the active deck.
  if (timeline) {
    const initialBeat = clampBeatIndex(timeline, startBeat ?? 0);
    const nextState = setCurrentBeat(state, initialBeat, { cmds, events });
    return { state: nextState, cmds, events };
  }

  // No timeline: machine exists but cannot play yet.
  events.push({
    kind: 'playback:phase',
    phase: state.phase,
  });

  return { state, cmds, events };
};
