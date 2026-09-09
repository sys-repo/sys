import { Err, Fs, Pkg, type t } from '../common.ts';
import { filepath } from './u.hash.ts';

/**
 * Load a `dist.json` file.
 */
export const load: t.Pkg.Dist.Load.Method = async (dir) => {
  dir = Fs.resolve(dir);
  const path = filepath(dir);
  const exists = await Fs.exists(path);
  const errors = Err.errors();
  if (!exists) errors.push(`File at path does not exist: ${path}`);

  let kind: t.Pkg.Dist.Load.Kind = exists ? 'invalid' : 'missing';
  let dist: t.DistPkg | undefined;
  let legacy: t.DistPkgLegacy | undefined;
  if (exists) {
    const loaded = (await Fs.readJson<unknown>(path)).data;
    if (Pkg.Is.dist(loaded)) {
      kind = 'canonical';
      dist = loaded;
    } else if (Pkg.Is.distCompat(loaded)) {
      kind = 'legacy';
      legacy = loaded;
    } else {
      errors.push(`The loaded file is not a valid DistPkg (canonical or legacy): ${path}`);
    }
  }

  return {
    exists,
    kind,
    path,
    dist,
    legacy,
    error: errors.toError('Several errors occured while loading the `dist.json`'),
  };
};
