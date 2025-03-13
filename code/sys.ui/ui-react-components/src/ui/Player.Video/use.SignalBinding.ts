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

  // Keep the player's current-time synced onto the signals.
  if (props && player && props.currentTime.value !== currentPlayerTime) {
    props.currentTime.value = currentPlayerTime;
  }

  /**
   * Handle: reset upon playback finish.
   */
  Signal.useSignalEffect(() => {
    // Register listeners.
    props?.ready.value;
    props?.currentTime.value;

    const isEnded = player?.currentTime === player?.duration;
    const loop = props?.loop.value ?? false;

    if (player && isEnded) {
      // NB: Hack to reset the video to the beginning.
      //     The VidStack player goes into a funny state when ended.
      player.play();
      if (!loop) Time.delay(100).then(() => player.pause());
    }
  });

  /**
   * Handle: jumpTo (aka "seek").
   */
  Signal.useSignalEffect(() => {
    // Register listeners.
    props?.ready.value;
    const jumpTo = props?.jumpTo.value;

    if (player && props) {
      if (typeof jumpTo?.second === 'number') {
        player.currentTime = jumpTo.second;
        if (jumpTo.play) player.play();
        if (!jumpTo.play) player.pause();
        props.jumpTo.value = undefined; // NB: reset after for next call.
      }
    }
  });

  /**
   * Handle: play/pause
   */
  Signal.useSignalEffect(() => {
    // Register listeners.
    props?.ready.value;
    const playing = props?.playing.value ?? false;

    if (player) {
      if (playing) player.play();
      if (!playing) player.pause();
    }
  });
}
