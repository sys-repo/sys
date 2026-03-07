import { type t, AssetsSchema } from './common.ts';
import { formatErrors } from './u.ts';

export const assets: t.SlugValidateAssetsManifest = (input) => {
  const parsed = AssetsSchema.Manifest.parse(input);
  if (parsed.ok) return { ok: true, sequence: parsed.value };
  return { ok: false, error: formatErrors(parsed.errors) };
};
