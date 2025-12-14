import { useRef } from 'react';
import { type t, Signal } from './common.ts';

export const usePlayerSignals: t.UsePlayerSignals = (signals, options = {}) => {
  type R = t.PlayerSignalsHook;
  type P = R['props'];
  const { log = false } = options;

  const lastTimeRef = useRef<t.Secs | undefined>(undefined);

  function listen() {
    if (!signals) return;
    const p = signals.props;

    // Subscribe redraw to "control + appearance" (low frequency).
    p.src.value;
    p.playing.value;
    p.muted.value;
    p.loop.value;
    p.autoPlay.value;

    p.aspectRatio.value;
    p.cornerRadius.value;
    p.scale.value;
    p.fadeMask.value;
    p.showControls.value;
    p.showFullscreenButton.value;
    p.showVolumeControl.value;

    p.jumpTo.value;
    p.buffered.value;
    p.buffering.value;
    p.slice.value;
    p.ready.value;

    /**
     * NOTE:
     * Intentionally NOT subscribing redraw to:
     *  - p.currentTime (high frequency)
     *  - p.duration    (can churn during metadata / stream init)
     */
  }

  /**
   * Effect: redraw
   */
  Signal.useRedrawEffect(listen);

  /**
   * Signals as view component property/handlers:
   */
  const props = ((): P => {
    if (!signals) return {};
    const p = signals.props;

    const onPlayingChange: P['onPlayingChange'] = (e) => {
      if (log) console.info(`⚡️ onPlayingChange:`, e);
      p.playing.value = e.playing;
    };

    const onMutedChange: P['onMutedChange'] = (e) => {
      if (log) console.info(`⚡️ onMutedChange:`, e);
      p.muted.value = e.muted;
    };

    const onEnded: P['onEnded'] = (e) => {
      if (log) console.info('⚡️ onEnded:', e);
    };

    const onBufferingChange: P['onBufferingChange'] = (e) => (p.buffering.value = e.buffering);
    const onBufferedChange: P['onBufferedChange'] = (e) => (p.buffered.value = e.buffered);

    const onTimeUpdate: P['onTimeUpdate'] = (e) => {
      const next: t.Secs = Number.isFinite(e.secs) ? Math.max(0, e.secs) : 0;
      const prev = lastTimeRef.current;

      // Only publish if meaningfully changed (avoid main-thread thrash).
      // 50ms granularity is more than enough for UI/debug telemetry.
      const delta = prev == null ? Infinity : Math.abs(next - prev);
      if (delta >= 0.05) {
        lastTimeRef.current = next;
        p.currentTime.value = next;
      }
    };

    const onDurationChange: P['onDurationChange'] = (e) => {
      const secs = e.secs;
      const finite = Number.isFinite(secs);
      const next: t.Secs = finite ? Math.max(0, secs) : 0;
      p.duration.value = next;
      p.ready.value = !!p.src.value && finite && next > 0;
    };

    return {
      src: p.src.value,

      autoPlay: p.autoPlay.value,
      playing: p.playing.value,
      buffering: p.buffering.value,
      buffered: p.buffered.value,

      muted: p.muted.value,
      loop: p.loop.value,
      aspectRatio: p.aspectRatio.value,
      cornerRadius: p.cornerRadius.value,
      scale: p.scale.value,
      fadeMask: p.fadeMask.value,
      showControls: p.showControls.value,
      showFullscreenButton: p.showFullscreenButton.value,
      showVolumeControl: p.showVolumeControl.value,
      slice: p.slice.value,

      jumpTo: p.jumpTo.value,

      onPlayingChange,
      onMutedChange,
      onEnded,
      onTimeUpdate,
      onDurationChange,
      onBufferingChange,
      onBufferedChange,
    };
  })();

  /**
   * API:
   */
  return { props };
};
