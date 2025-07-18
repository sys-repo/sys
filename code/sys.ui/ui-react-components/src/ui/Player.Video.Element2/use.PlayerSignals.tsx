import { type t, Signal } from './common.ts';

export const usePlayerSignals: t.UsePlayerSignals = (signals, options = {}) => {
  type R = t.PlayerSignalsHook;
  type P = R['props'];
  const { log = true } = options;

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

    return {
      src: p.src.value,
      autoPlay: p.autoPlay.value,
      playing: p.playing.value,
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
    };
  })();

  /**
   * API:
   */
  return { props };
};
