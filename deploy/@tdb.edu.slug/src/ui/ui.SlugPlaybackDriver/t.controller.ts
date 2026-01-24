import type { t } from './common.ts';

/**
 * Factory surface.
 */
export type SlugPlaybackControllerLib = {
  create(props: SlugPlaybackControllerProps): SlugPlaybackController;
};

/**
 * SlugPlaybackController - an EffectController for slug playback orchestration.
 */
export type SlugPlaybackController = t.EffectController<
  SlugPlaybackState,
  SlugPlaybackPatch,
  SlugPlaybackControllerProps
>;

/** Static config properties of the controller. */
export type SlugPlaybackControllerProps = { baseUrl: t.StringUrl };
export type SlugPlaybackPatch = Partial<SlugPlaybackState>;

/**
 * SlugPlaybackController state.
 */
export type SlugPlaybackState = {
  /** TreeHost view of available slugs. */
  readonly tree?: t.TreeHostViewNodeList;

  /** Currently selected TreeHost path. */
  readonly selectedPath?: t.ObjectPath;

  /** Terminal load error, if any. */
  readonly error?: { readonly message: string };
} & StateParts;

/** State property partitions. */
type StateParts = SlugPlaybackLoading & SlugPlaybackRuntime;

export type SlugPlaybackLoading = {
  /** Indicates an in-flight slug load. */
  readonly isLoading?: boolean;
  /** Ref currently being fetched (staleness guard). */
  readonly loadingRef?: string;
  /** Ref last successfully loaded. */
  readonly loadedRef?: string;
};

export type SlugPlaybackRuntime = {
  /** Loaded playback bundle (timeline spec + resolver). */
  readonly bundle?: t.TimecodePlaybackDriver.Wire.Bundle;
  /** Video signal decks for rendering (A/B). */
  readonly decks?: t.TimecodePlaybackDriver.VideoDecks;
  /** Latest playback reducer snapshot (debug + UI wiring). */
  readonly snapshot?: t.TimecodeState.Playback.Snapshot;
};
