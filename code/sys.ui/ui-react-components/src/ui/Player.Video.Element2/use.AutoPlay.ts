import React, { useLayoutEffect } from 'react';
import { READY_STATE } from './common.ts';

type Args = {
  src: string;
  mutedProp: boolean;
  wantPlay: boolean;
  setWantPlay: React.Dispatch<React.SetStateAction<boolean>>;
  videoRef: React.RefObject<HTMLVideoElement>;
};

/**
 * Auto-start playback when `wantPlay` flips true.
 *
 *  - Plays immediately if allowed.
 *  - If blocked, retries muted (when not already muted && mutedProp === false).
 *  - If still blocked, waits for the next user gesture (pointerdown) then plays.
 *  - Cleans up listeners on unmount or dep change.
 */
export function useAutoplay(args: Args) {
  const { src, wantPlay, mutedProp, setWantPlay, videoRef } = args;

  /**
   * Effect:
   */
  useLayoutEffect(() => {
    const el = videoRef.current;
    if (!el || !wantPlay) return;

    let done = false;
    let offGesture: (() => void) | undefined;

    const waitGesture = () =>
      new Promise<void>((resolve) => {
        offGesture = once('pointerdown', () => resolve());
      });

    const tryPlayOnce = async (): Promise<boolean> => {
      try {
        await el.play();
        return true;
      } catch (err) {
        const e = err as DOMException;
        if (e?.name !== 'NotAllowedError') console.error(err);
        return false;
      }
    };

    const start = async () => {
      if (done) return;

      // 1. Normal attempt:
      if (await tryPlayOnce()) return finish();

      // 2. Retry muted (only if caller did not request muted playback already):
      if (!mutedProp && !el.muted) {
        el.muted = true;
        if (await tryPlayOnce()) return finish();
      }

      // 3. wait for user gesture, then final try
      await waitGesture();
      if (done) return;
      await tryPlayOnce();
      finish();
    };

    const finish = () => {
      if (done) return;
      done = true;
      offGesture?.();
      setWantPlay(false);
    };

    /**
     * Attempt auto-play:
     */
    if (el.readyState >= READY_STATE.HAVE_FUTURE_DATA) {
      void start();
    } else {
      const onCanPlay = () => void start();
      el.addEventListener('canplay', onCanPlay, { once: true });
      return () => {
        done = true;
        el.removeEventListener('canplay', onCanPlay);
        offGesture?.();
      };
    }

    // Finish up.
    return () => {
      done = true;
      offGesture?.();
    };
  }, [src, wantPlay, mutedProp, setWantPlay, videoRef]);
}

/**
 * Helpers:
 */
const once = <K extends keyof WindowEventMap>(
  type: K,
  fn: (e: WindowEventMap[K]) => void,
  opts: AddEventListenerOptions = { capture: true },
) => {
  const handler = (e: Event) => {
    window.removeEventListener(type, handler, opts);
    fn(e as WindowEventMap[K]);
  };
  window.addEventListener(type, handler, opts);
  return () => window.removeEventListener(type, handler, opts);
};
