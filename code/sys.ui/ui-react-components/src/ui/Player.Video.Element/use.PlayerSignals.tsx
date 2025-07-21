import { type t, Signal } from './common.ts';

export const usePlayerSignals: t.UsePlayerSignals = (signals, options = {}) => {
  type R = t.PlayerSignalsHook;
  type P = R['props'];
  const { log = false } = options;

  /**
   * Effect: redraw
   */
  Signal.useRedrawEffect(() => {
    if (!signals) return;
    const p = signals.props;
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
  });

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
    const onTimeUpdate: P['onTimeUpdate'] = (e) => (p.currentTime.value = e.secs);
    const onDurationChange: P['onDurationChange'] = (e) => {
      p.duration.value = e.secs;
      p.ready.value = e.secs > 0;
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
