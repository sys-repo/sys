import { type t, PlaybackSchema } from '../common.ts';
import { formatErrors } from './u.ts';

export const validatePlaybackManifest = (
  input: unknown,
): t.ValidateResult<t.SlugPlaybackManifest> => {
  const parsed = PlaybackSchema.Manifest.parse(input);
  if (parsed.ok) return { ok: true, sequence: parsed.value };
  return { ok: false, error: formatErrors(parsed.errors) };
};
