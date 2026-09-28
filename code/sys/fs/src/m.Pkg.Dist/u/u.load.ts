import { D, Err, Fs, Pkg, type t } from '../common.ts';
import { DEFAULT_IO } from '../u.verify/u.io.ts';
import { admitManifest, parseManifestBytes } from '../u.verify/u.manifest.ts';
import { readManifest, resolveLocalRoot } from '../u.verify/u.tree.ts';
import { filepath } from './u.hash.ts';

/**
 * Bounded supported-document observation. No conversion or independent payload authority.
 */
export const load: t.Pkg.Dist.Load.Method = async (dir) => {
  const path = filepath(Fs.resolve(dir));
  const exists = await Fs.exists(path);
  if (!exists) {
    return { exists, path, kind: 'missing', error: Err.std('Dist manifest is missing.') };
  }
  try {
    const signal = new AbortController().signal;
    // Observation accepts ordinary caller root spelling; inventory paths are never repaired.
    // Verification callers still supply their independently selected canonical root.
    const canonical = await DEFAULT_IO.realPath(Fs.dirname(path));
    const root = await resolveLocalRoot(DEFAULT_IO, canonical, signal);
    const document = await readManifest(DEFAULT_IO, root, D.contentLimits.manifestBytes, signal);
    const parsed = parseManifestBytes(document.bytes, D.contentLimits);
    admitManifest(parsed, D.contentLimits);
    if (!Pkg.Is.dist(parsed)) throw new Error('Unsupported Dist observation shape.');
    return { exists, path, kind: 'canonical', dist: parsed };
  } catch {
    return { exists, path, kind: 'invalid', error: Err.std('Invalid Dist manifest.') };
  }
};
