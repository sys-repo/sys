import { Pkg } from '@sys/std/pkg';
import { distTypePath, pkg as typesPkg } from '@sys/types';
import { pkg as fsPkg } from '../../pkg.ts';
import {
  CompositeHash,
  D,
  Delete,
  Err,
  Fs,
  Hash,
  Is,
  Json,
  JsrUrl,
  type t,
  Time,
} from '../common.ts';
import { bytes, hashes, ignore } from './u.hash.ts';

/**
 * Prepare and optionally save distribution-package metadata.
 */
export const compute: t.Pkg.Dist.Compute.Method = async (args) => {
  const { filter, trustChildDist = false, onHashProgress, ignore: ignoreInput } = args;
  const save = Is.bool(args.save) ? args.save : false;
  const dir = Fs.resolve(args.dir);
  let error: t.StdError | undefined;
  const policy = await ignore(ignoreInput);
  const exists = await Fs.exists(dir);
  if (!exists) error = Err.std(`The given "dist" directory for the package does not exist: ${dir}`);
  else if (!await Fs.Is.dir(dir)) {
    error = Err.std(`The given "dist" path is not a directory: ${dir}`);
  }

  const hash = exists
    ? await hashes(dir, { filter, trustChildDist, onHashProgress, ignore: policy })
    : { digest: '', parts: {} };
  const size: t.DistPkg['build']['size'] = {
    total: await bytes(dir, Object.keys(hash.parts)),
    pkg: CompositeHash.size(hash.parts, (part) => Pkg.Dist.Is.codePath(part.path)) ?? 0,
  };
  const dist: t.DistPkg = {
    type: JsrUrl.Pkg.file(typesPkg, distTypePath),
    ...(args.pkg ? { pkg: args.pkg } : {}),
    build: {
      time: Time.now.timestamp,
      size,
      builder: Pkg.toString(args.builder ?? Pkg.unknown()) as t.StringScopedPkgNameVer,
      runtime:
        `deno=${Deno.version.deno}:v8=${Deno.version.v8}:typescript=${Deno.version.typescript}`,
      hash: {
        policy: JsrUrl.Pkg.file(fsPkg, D.hashPolicy.path),
        ignore: { format: 'gitignore', rules: [...policy.rules], 'rules:digest': policy.digest },
      },
    },
    hash,
  };
  const json = Json.stringify(dist, 2);
  const res = Delete.undefined<t.Pkg.Dist.Compute.Response>({
    dir,
    exists,
    dist,
    manifest: { integrity: Hash.sha256(json) },
    error,
  });
  if (save && exists && !error) {
    const written = await Fs.write(Fs.join(dir, 'dist.json'), json);
    if (written.error) throw written.error;
  }
  return res;
};
