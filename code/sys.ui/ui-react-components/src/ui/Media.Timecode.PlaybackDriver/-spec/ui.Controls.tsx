import type { DebugSignals } from './-SPEC.Debug.tsx';

import React from 'react';
import { type t, Player } from './common.ts';

export type ControlsProps = {
  debug?: DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Controls: React.FC<ControlsProps> = (props) => {
  const { debug } = props;
  const controller = debug?.props.controller.value;
  const snapshot = debug?.props.snapshot.value;
  const state = snapshot?.state;
  const timeline = state?.timeline;

  const activeDeck = state?.decks.active;
  const status = activeDeck ? state?.decks.status[activeDeck] : undefined;
  const ready = activeDeck ? state?.ready.deck?.[activeDeck] : undefined;

  const playing = status === 'playing';
  const buffering = status === 'buffering' || ready === false;
  const currentTime = state?.vTime != null ? Number(state.vTime) / 1000 : undefined;
  const duration = timeline ? Number(timeline.virtualDuration) / 1000 : undefined;

  const onClick: t.PlayerControlsButtonHandler = (e) => {
    if (!controller) return;
    if (e.button === 'Play') controller.toggle();
  };

  const onSeeking: t.PlayerControlSeekChangeHandler = (e) => {
    if (!controller || !timeline || !e.complete) return;
    const vTime = Math.max(0, e.currentTime * 1000);
    const beatIndex = beatIndexFromVTime(timeline, vTime);
    controller.seekToBeat(beatIndex);
  };

  return (
    <Player.Video.Controls.UI
      theme={props.theme}
      enabled={!!controller && !!timeline}
      playing={playing}
      buffering={buffering}
      currentTime={currentTime}
      duration={duration}
      maskOpacity={0}
      background={{ rounded: 6, opacity: 0.4, shadow: false }}
      padding={15}
      margin={[10, 0, 20, 0]}
      onClick={onClick}
      onSeeking={onSeeking}
    />
  );
};

function beatIndexFromVTime(
  timeline: t.TimecodeState.Playback.Timeline,
  vTime: t.Msecs,
): t.TimecodeState.Playback.BeatIndex {
  const beats = timeline.beats;
  if (beats.length === 0) return 0 as t.TimecodeState.Playback.BeatIndex;

  for (let i = beats.length - 1; i >= 0; i--) {
    const beat = beats[i];
    const from = Number(beat.vTime);
    const pause = Number(beat.pause ?? 0);
    const to = from + Number(beat.duration) + pause;
    if (Number(vTime) >= from && Number(vTime) < to) return beat.index;
  }

  if (Number(vTime) < Number(beats[0].vTime)) return beats[0].index;
  return beats[beats.length - 1].index;
}
