import { useLayoutEffect } from 'react';
import { READY_STATE } from './common.ts';

type Args = {
  enabled: boolean;
  src?: string;
  muted: boolean; // current incoming mute state (best guess)
  videoRef: React.RefObject<HTMLVideoElement>;

  /**
   * Lifecycle callbacks to request state from above.
   */
  onStart?: () => void; // initial autoplay intent
  onMutedRetry?: () => void; // request: please mute + retry
  onGesturePlay?: () => void; // user tapped; please play
  onGiveUp?: () => void; // autoplay over; not playing
};

/**
 * Attempt to start playback automatically when enabled.
 * NOTE: Does not hold local React state; purely effectful + callbacks.
 */
export function useAutoplay(args: Args) {
  const { enabled, src, muted, videoRef, onStart, onMutedRetry, onGesturePlay, onGiveUp } = args;

  useLayoutEffect(() => {
    if (!enabled) return;

    const el = videoRef.current;
    if (!el) return;

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

    const finish = (played: boolean) => {
      if (done) return;
      done = true;
      offGesture?.();
      if (!played) onGiveUp?.();
    };

    const start = async () => {
      if (done) return;
      onStart?.();

      // 1. Normal attempt:
      if (await tryPlayOnce()) {
        finish(true);
        return;
      }

      // 2. Retry muted (if not already muted):
      if (!muted && !el.muted) {
        onMutedRetry?.(); // request upstream mute
        el.muted = true; // provisional (if parent controlled it'll re-render)
        if (await tryPlayOnce()) {
          finish(true);
          return;
        }
      }

      // 3. Wait for user gesture:
      await waitGesture();
      if (done) return;
      onGesturePlay?.();
      if (await tryPlayOnce()) {
        finish(true);
      } else {
        finish(false);
      }
    };

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

    return () => {
      done = true;
      offGesture?.();
    };
  }, [enabled, src, muted, videoRef, onStart, onMutedRetry, onGesturePlay, onGiveUp]);
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
