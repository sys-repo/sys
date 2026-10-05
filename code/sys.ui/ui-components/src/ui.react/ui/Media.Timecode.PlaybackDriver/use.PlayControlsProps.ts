import React from 'react';
import { type t, TimecodeState } from './common.ts';
import { deriveState } from './use.PlayControlsProps.u.ts';

export function usePlayControlsProps(
  args: t.UsePlayControlsPropsArgs,
): t.UsePlayControlsPropsResult {
  const { controller, timeline, decks, activeSignals, props } = deriveState(args);

  /**
   * Seek UI smoothing:
   * - While scrubbing → show scrub time.
   * - On scrub complete → hold desired time until snapshot catches up (prevents snap-back).
   */
  const desiredSeekRef = React.useRef<t.Secs | undefined>(undefined);
  const [overrideTime, setOverrideTime] = React.useState<t.Secs | undefined>(undefined);

  React.useEffect(() => {
    desiredSeekRef.current = undefined;
    setOverrideTime(undefined);
  }, [timeline, props.enabled]);

  React.useEffect(() => {
    const desired = desiredSeekRef.current;
    if (desired == null) return;

    const curr = props.currentTime;
    if (curr == null) return;

    // Epsilon: allow tiny mismatch while media settles.
    const EPS = 0.2; // seconds
    if (Math.abs(curr - desired) <= EPS) {
      desiredSeekRef.current = undefined;
      setOverrideTime(undefined);
    }
  }, [props.currentTime]);

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
      // Always reflect the user's hand immediately.
      setOverrideTime(e.currentTime);

      if (!controller || !timeline) return;
      if (!e.complete) return;

      // Hold until snapshot lands.
      desiredSeekRef.current = e.currentTime;

      const vTime = Math.max(0, e.currentTime * 1000);
      const beatIndex = TimecodeState.Playback.Util.beatIndexAtVTime(timeline, vTime);
      controller.seekToBeat(beatIndex);
    },
    [controller, timeline],
  );

  const currentTime = overrideTime ?? props.currentTime;

  return {
    ...props,
    currentTime,
    onClick,
    onSeeking,
  };
}
