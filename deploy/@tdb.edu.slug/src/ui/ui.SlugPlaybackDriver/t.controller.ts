import type { t } from './common.ts';

/**
 * Factory surface.
 */
export type SlugPlaybackControllerLib = {
  create(props: SlugPlaybackControllerProps): SlugPlaybackController;
};

export type SlugPlaybackControllerProps = { baseUrl: t.StringUrl };

/**
 * SlugPlaybackController state.
 */
export type SlugPlaybackState = {
  readonly tree?: t.TreeHostViewNodeList;
  readonly selectedPath?: t.ObjectPath;
  readonly isLoading?: boolean;
  readonly error?: { readonly message: string };
  readonly slug?: unknown; // Loaded bundle / manifest.
  readonly loadingRef?: string;
  readonly loadedRef?: string;
};

/**
 * Patch expresses intent.
 */
export type SlugPlaybackPatch = Partial<SlugPlaybackState>;

/**
 * SlugPlaybackController — an EffectController for slug playback orchestration.
 */
export type SlugPlaybackController = t.EffectController<
  SlugPlaybackState,
  SlugPlaybackPatch,
  SlugPlaybackControllerProps
>;
