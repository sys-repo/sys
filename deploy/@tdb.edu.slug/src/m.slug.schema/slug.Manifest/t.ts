import type { t } from './common.ts';
import type {
  AssetsManifest,
  PlaybackManifest,
  SlugAssetsSchemaLib,
  TimecodePlaybackSchemaLib,
} from '@sys/schema/t';

export type SlugAssetsManifest = AssetsManifest;
export type SlugPlaybackManifest = PlaybackManifest;

export type SlugManifestSchemaLib = {
  readonly Assets: SlugAssetsSchemaLib;
  readonly Playback: TimecodePlaybackSchemaLib;
  readonly Validate: {
    readonly assets: SlugValidateAssetsManifest;
    readonly playback: SlugValidatePlaybackManifest;
  };
};

export type SlugValidateAssetsManifest = (input: unknown) => t.ValidateResult<t.SlugAssetsManifest>;
export type SlugValidatePlaybackManifest = (input: unknown) => SlugValidatePlaybackManifestResult;
export type SlugValidatePlaybackManifestResult = t.ValidateResult<t.SlugPlaybackManifest>;
