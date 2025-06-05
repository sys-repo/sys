import { type MediaPlayerInstance, useMediaState } from '@vidstack/react';
import React from 'react';
import { type t, Signal } from './common.ts';

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

  const currentTime = useMediaState('currentTime', playerRef);
  const isPlaying = useMediaState('playing', playerRef);

  /**
   * Effect: Keep the signal updated with the current "is-playing" state.
   */
  React.useEffect(() => {
    if (!props) return;
    if (props.playing.value !== isPlaying) props.playing.value = isPlaying;
  }, [isPlaying]);

  /**
   * Effect: Sync the signals with the <Player>'s current state.
   */
  React.useEffect(() => {
    if (!props) return;
    if (props.currentTime.value !== currentTime) props.currentTime.value = currentTime;
  }, [currentTime, props]);

  /**
   * Handle: jumpTo (aka. "seek").
   */
  Signal.useEffect(() => {
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
   * Handle: play/pause.
   */
  Signal.useEffect(() => {
    props?.ready.value;
    const isPlaying = props?.playing.value ?? false;
    if (player) {
      if (isPlaying && player.paused) player.play();
      if (!isPlaying && !player.paused) player.pause();
    }
  });
}
