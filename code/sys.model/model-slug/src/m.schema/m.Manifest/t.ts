import type { t } from './common.ts';
import type { PlaybackManifest, TimecodePlaybackSchemaLib } from '@sys/model/t';

/** Playback-manifest document alias for slug bundles. */
export type SlugPlaybackManifest = PlaybackManifest;

/** Schema library for slug manifests. */
export type SlugManifestSchemaLib = {
  readonly Assets: t.SlugAssetsSchemaLib;
  readonly Playback: TimecodePlaybackSchemaLib;
  readonly Validate: {
    readonly assets: SlugValidateAssetsManifest;
    readonly playback: SlugValidatePlaybackManifest;
  };
};

/** Validator for asset manifests. */
export type SlugValidateAssetsManifest = (
  input: unknown,
) => t.SlugValidateResult<t.SlugAssetsManifest>;
/** Validator for playback manifests. */
export type SlugValidatePlaybackManifest = (input: unknown) => SlugValidatePlaybackManifestResult;
/** Result type for playback-manifest validation. */
export type SlugValidatePlaybackManifestResult = t.SlugValidateResult<t.SlugPlaybackManifest>;
