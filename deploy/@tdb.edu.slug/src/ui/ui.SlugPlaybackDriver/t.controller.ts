import type { t } from './common.ts';

/**
 * Factory surface.
 */
export type SlugPlaybackControllerLib = {
  create(args: { baseUrl: t.StringUrl }): SlugPlaybackController;
};

/**
 * SlugPlaybackController state.
 */
export type SlugPlaybackState = {
  readonly tree?: t.TreeHostViewNodeList;
  readonly selectedPath?: t.ObjectPath;
  readonly isLoading?: boolean;
  readonly error?: { readonly message: string };
  readonly slug?: unknown; // Loaded bundle / manifest.
};

/**
 * Patch expresses intent.
 */
export type SlugPlaybackPatch = Partial<SlugPlaybackState>;

/**
 * SlugPlaybackController — an EffectController for slug playback orchestration.
 */
export type SlugPlaybackController = t.EffectController<SlugPlaybackState, SlugPlaybackPatch>;
