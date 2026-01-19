import { AssetsSchema } from '@sys/schema/slug/assets';
import { PlaybackSchema } from '@sys/schema/timecode/playback';

import type { t } from '../common.ts';

const formatErrors = (errors: readonly t.ValueError[]) => {
  const joined = errors
    .map((error) => {
      const path = Array.isArray(error.path) ? error.path.join('/') : error.path;
      return path ? `${path}: ${error.message}` : error.message;
    })
    .join('; ');
  return new Error(joined || 'Schema validation failed');
};

export const validateAssetsManifest = (input: unknown): t.ValidateResult<t.SlugAssetsManifest> => {
  const parsed = AssetsSchema.Manifest.parse(input);
  if (parsed.ok) return { ok: true, sequence: parsed.value };
  return { ok: false, error: formatErrors(parsed.errors) };
};

export const validatePlaybackManifest = (
  input: unknown,
): t.ValidateResult<t.SlugPlaybackManifest> => {
  const parsed = PlaybackSchema.Manifest.parse(input);
  if (parsed.ok) return { ok: true, sequence: parsed.value };
  return { ok: false, error: formatErrors(parsed.errors) };
};
