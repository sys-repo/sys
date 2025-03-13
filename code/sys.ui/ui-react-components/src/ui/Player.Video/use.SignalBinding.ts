import { type MediaPlayerInstance, useMediaState } from '@vidstack/react';
import React from 'react';
import { type t, Signal, Time } from './common.ts';

/**
 * Manages keeping the <VideoPlayer> component in sync with
 * the current state of the Signals API.
 */
export function useSignalBinding(args: {
  playerRef: React.RefObject<MediaPlayerInstance>;
  signals?: t.VideoPlayerSignals;
}) {
  const { playerRef, signals } = args;
  const props = signals?.props;
  const player = playerRef.current || undefined;
  const currentPlayerTime = useMediaState('currentTime', playerRef);

  // Keep current-time synced onto the signals.
  if (props && player && props.currentTime.value !== currentPlayerTime) {
    props.currentTime.value = currentPlayerTime;
  }

  /**
   * Handle: reset upon playback finish.
   */
  Signal.useSignalEffect(() => {
    signals?.props.currentTime.value; // NB: listen to value.
    const isEnded = player?.currentTime === player?.duration;

    if (player && isEnded) {
      // NB: Hack to reset the video to the beginning.
      //     The VidStack player goes into a funny state when ended.
      player.play();
      Time.delay(100).then(() => player.pause());
    }
  });

  /**
   * Handle: jumpTo (aka "seek").
   */
  Signal.useSignalEffect(() => {
    const jumpTo = props?.jumpTo.value; // NB: ensure the effect is hooked up to the value.
    if (!player || !props) return;
    if (typeof jumpTo?.time === 'number') {
      player.currentTime = jumpTo.time;
      if (jumpTo.play) player.play();
      props.jumpTo.value = undefined; // NB: reset after for next call.
    }
  });
}
