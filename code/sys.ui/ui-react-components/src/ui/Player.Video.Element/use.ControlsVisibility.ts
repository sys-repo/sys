import React, { useEffect, useRef } from 'react';
import { type t, Signal } from './common.ts';

export function useControlsVisibility(args: {
  video?: t.VideoPlayerSignals;
  isOver?: boolean;
  hideAfter?: t.Msecs;
}) {
  const { video, isOver, hideAfter = 1000 } = args;

  const timeoutRef = useRef<number | null>(null);
  const [visible, setVisible] = React.useState(true);

  const clearHideTimeout = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const updateState = () => {
    const show = (visible = true) => {
      clearHideTimeout();
      setVisible(visible);
    };

    if (!video || isOver) return show();

    const { playing, ready, buffering, src } = wrangle.props(video);
    if (!ready || !src) return show();

    if (playing || buffering) {
      show(true);
      timeoutRef.current = window.setTimeout(() => show(false), hideAfter);
      return;
    }

    show(); // If not playing, always show controls.
  };

  /**
   * Effect: listeners.
   */
  useEffect(() => void updateState(), [video?.instance, isOver]);
  Signal.useEffect(() => {
    if (video) wrangle.props(video);
    updateState();
  });

  /**
   * API:
   */
  return visible;
}

/**
 * Helpers:
 */
const wrangle = {
  /**
   * Peel of relevant signal properties to the hook.
   */
  props(video: t.VideoPlayerSignals) {
    const p = video.props;
    const src = p.src.value;
    const playing = p.playing.value;
    const ready = p.ready.value;
    const buffering = p.buffering.value;
    return { src, playing, ready, buffering };
  },
} as const;
