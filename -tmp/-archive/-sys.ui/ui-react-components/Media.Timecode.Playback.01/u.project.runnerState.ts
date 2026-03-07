import type { t } from './common.ts';

/**
 * Pure: project PlaybackState → PlaybackRunnerState.
 *
 * Canonical read-model for UI/controller subscriptions.
 */
export function projectRunnerState(state: t.TimecodeState.Playback.State): t.PlaybackRunnerState {
  const { phase, intent, currentBeat, decks } = state;
  return {
    state,
    phase,
    intent,
    currentBeat,
    decks,
  };
}
