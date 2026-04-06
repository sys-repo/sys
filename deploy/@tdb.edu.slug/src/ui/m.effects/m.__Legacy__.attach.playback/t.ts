import type { t } from '../common.ts';

/** Effect adapter for playback runtime state. */
export type PlaybackEffectAdapter = t.EffectAdapter<SlugPlaybackRuntimeState | undefined>;

/** Runtime playback state used by legacy slug playback effects. */
export type SlugPlaybackRuntimeState = {
  /** Loaded playback bundle (timeline spec + resolver). */
  readonly bundle?: t.TimecodePlaybackDriver.Wire.Bundle;

  /** Timeline controller surface (inner playback controller) */
  readonly timeline?: t.TimecodePlaybackDriver.TimelineController;
  /** Video signal decks for rendering (A/B). */
  readonly decks?: t.TimecodePlaybackDriver.VideoDecks;
  /** Latest playback reducer snapshot (debug + UI wiring). */
  readonly snapshot?: t.TimecodeState.Playback.Snapshot;
  /** Composite-resolved timeline (segments, diagnostics, validity). */
  readonly resolved?: t.Timecode.Composite.Resolved;
  /** Experience timeline (beats projected onto virtual time). */
  readonly experience?: t.Timecode.Experience.Timeline;
};
