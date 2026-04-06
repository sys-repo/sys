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
/** Partial playback-state update. */
export type SlugPlaybackPatch = Partial<SlugPlaybackState>;

/**
 * SlugPlaybackController state.
 */
export type SlugPlaybackState = {
  /** Slug selection and loading state. */
  readonly slug?: t.SlugPlaybackSlugState;

  /** Playback runtime state. */
  readonly playback?: t.SlugPlaybackRuntimeState;
};
