import type { t } from './common.ts';
import type { DriverInfoProps } from './-dev/ui.DriverInfo.tsx';

/** Type re-exports. */
export type * from './t.controller.ts';

/**
 * SlugPlaybackDriver
 *
 * Slug-aware media playback driver that connects TreeHost selection
 * to audiovisual content rendering within aux slot.
 */
export type SlugPlaybackDriverLib = {
  readonly Dev: SlugPlaybackDriverDevLib;
  readonly Controller: t.SlugPlaybackControllerLib;
};

/**
 * Dev helpers for the SlugPlaybackDriver
 */
export type SlugPlaybackDriverDevLib = {
  readonly DriverInfo: t.FC<DriverInfoProps>;
};
