import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.controller.ts';

/**
 * SlugPlaybackDriver
 *
 * Slug-aware media playback driver that connects TreeHost selection
 * to audiovisual content rendering within the aux slot.
 */
export type SlugPlaybackDriverLib = {
  readonly Controller: t.SlugPlaybackControllerLib;
};
