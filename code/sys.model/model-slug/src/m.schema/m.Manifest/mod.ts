import { type t, AssetsSchema as Assets, PlaybackSchema as Playback } from './common.ts';
import { assets } from './u.validate.assets.ts';
import { playback } from './u.validate.playback.ts';

export const ManifestSchema: t.SlugManifestSchemaLib = {
  Assets,
  Playback,
  Validate: { playback, assets },
};
