import type { t } from './common.ts';
import type { PlaybackManifest, TimecodePlaybackSchemaLib } from '@sys/model/t';

export type SlugPlaybackManifest = PlaybackManifest;

export type SlugManifestSchemaLib = {
  readonly Assets: t.SlugAssetsSchemaLib;
  readonly Playback: TimecodePlaybackSchemaLib;
  readonly Validate: {
    readonly assets: SlugValidateAssetsManifest;
    readonly playback: SlugValidatePlaybackManifest;
  };
};

export type SlugValidateAssetsManifest = (
  input: unknown,
) => t.SlugValidateResult<t.SlugAssetsManifest>;
export type SlugValidatePlaybackManifest = (input: unknown) => SlugValidatePlaybackManifestResult;
export type SlugValidatePlaybackManifestResult = t.SlugValidateResult<t.SlugPlaybackManifest>;
