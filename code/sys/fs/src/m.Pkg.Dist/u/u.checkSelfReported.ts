import { DirHash } from '../../m.Dir.Hash/mod.ts';
import { Err, Fs, Ignore, Obj, type t } from '../common.ts';
import { hashesBase, ignore } from './u.hash.ts';
import { load } from './u.load.ts';

/**
 * Check a folder against its own distribution-package hash definitions.
 */
export const checkSelfReported: t.Pkg.Dist.CheckSelfReported.Method = async (dir, hash) => {
  dir = Fs.resolve(dir);
  const errors = Err.errors();
  const loaded = await load(dir);
  const { path, dist, exists } = loaded;
  if (!exists) errors.push(`File at path does not exist: ${path}`);
  else if (!dist) {
    errors.push(`Cannot check self-reported non-canonical dist.json (${loaded.kind}): ${path}`);
  }

  const res: t.Pkg.Dist.CheckSelfReported.Response = { exists, dist, is: { valid: undefined } };
  if (exists && dist) {
    const root = Fs.dirname(path);
    const distfile = Fs.join(root, 'dist.json');
    res.is = (await DirHash.verify(root, hash ?? distfile)).is;
    const meta = dist.build.hash.ignore;
    if (meta) {
      const digest = await Ignore.digest(meta.rules);
      if (digest !== meta['rules:digest']) {
        errors.push(`Dist ignore-policy digest mismatch: ${distfile}`);
      } else {
        const replay = await hashesBase(root, undefined, undefined, await ignore(meta.rules));
        if (!Obj.eql(replay, dist.hash)) {
          errors.push(`Dist ignore-policy does not reproduce hash.parts: ${distfile}`);
        }
      }
    }
    if (errors.length > 0) res.is.valid = false;
  }
  res.error = errors.toError();
  return res;
};
