import type { t } from './common.ts';

/**
 * Factory surface.
 */
export type SlugPlaybackControllerLib = {
  create(props: SlugPlaybackControllerProps): SlugPlaybackController;
};

/** Static config properties of the controller. */
export type SlugPlaybackControllerProps = { baseUrl: t.StringUrl };

/** Patch expresses intent. */
export type SlugPlaybackPatch = Partial<SlugPlaybackState>;

/**
 * SlugPlaybackController state.
 */
export type SlugPlaybackState = {
  /** TreeHost view of available slugs. */
  readonly tree?: t.TreeHostViewNodeList;

  /** Currently selected TreeHost path. */
  readonly selectedPath?: t.ObjectPath;

  /** Indicates an in-flight slug load. */
  readonly isLoading?: boolean;

  /** Loaded playback bundle (timeline spec + resolver). */
  readonly bundle?: t.TimecodePlaybackDriver.Wire.Bundle;

  /** Ref currently being fetched (staleness guard). */
  readonly loadingRef?: string;
  /** Ref last successfully loaded. */
  readonly loadedRef?: string;

  /** Terminal load error, if any. */
  readonly error?: { readonly message: string };
};

/**
 * SlugPlaybackController - an EffectController for slug playback orchestration.
 */
export type SlugPlaybackController = t.EffectController<
  SlugPlaybackState,
  SlugPlaybackPatch,
  SlugPlaybackControllerProps
>;
