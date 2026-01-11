import React from 'react';
import { type t, TimecodeState } from './common.ts';
import { deriveState } from './use.ControlsProps.u.ts';

export function useControlsProps(args: t.UseControlsPropsArgs): t.UseControlsPropsResult {
  const { controller, timeline, decks, activeSignals, props } = deriveState(args);

  const onClick = React.useCallback<t.PlayerControlsButtonHandler>(
    (e) => {
      if (e.button === 'Play') return void controller?.toggle();
      if (e.button !== 'Mute') return;

      const next = !(activeSignals?.props.muted.value ?? false);
      if (decks?.A) decks.A.props.muted.value = next;
      if (decks?.B) decks.B.props.muted.value = next;
    },
    [controller, activeSignals, decks],
  );

  const onSeeking = React.useCallback<t.PlayerControlSeekChangeHandler>(
    (e) => {
      if (!controller || !timeline || !e.complete) return;
      const vTime = Math.max(0, e.currentTime * 1000);
      const beatIndex = TimecodeState.Playback.Util.beatIndexAtVTime(timeline, vTime);
      controller.seekToBeat(beatIndex);
    },
    [controller, timeline],
  );

  return { ...props, onClick, onSeeking };
}
