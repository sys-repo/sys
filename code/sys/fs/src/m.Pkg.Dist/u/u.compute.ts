import { distTypePath, pkg as typesPkg } from '@sys/types';
import { pkg as fsPkg } from '../../pkg.ts';
import { D, Err, Fs, Hash, Is, Json, JsrUrl, Pkg, type t, Time } from '../common.ts';
import type { IgnorePolicy, StrictManifest } from '../t.internal.ts';
import { captureContent } from '../u.verify/u.manifest.ts';
import { hashes, ignore } from './u.hash.ts';

/**
 * Prepare the sole supported Dist manifest and optionally save its exact bytes.
 * Failure returns no manifest or pin; a failed save does not promise filesystem rollback.
 */
export const compute: t.Pkg.Dist.Compute.Method = async (args) => {
  const { filter, trustChildDist = false, onHashProgress, ignore: ignoreInput } = args;
  const save = Is.bool(args.save) ? args.save : false;
  const dir = Fs.resolve(args.dir);
  const exists = await Fs.exists(dir);
  try {
    if (!exists) throw new Error('Dist directory does not exist.');
    if (!await Fs.Is.dir(dir)) throw new Error('Dist path is not a directory.');
    const policy = await ignore(ignoreInput);
    const collected = await hashes(dir, { filter, trustChildDist, onHashProgress, ignore: policy });
    const admitted = captureContent(collected.parts, D.contentLimits);
    const dist = createManifest(args, admitted, policy);
    const json = serializeManifest(dist);
    const pin: t.DistPin = Object.freeze({ scheme: dist.hash.scheme, digest: dist.hash.digest });
    if (save) {
      const written = await Fs.write(Fs.join(dir, 'dist.json'), json);
      if (written.error) throw written.error;
    }
    return {
      kind: 'computed',
      exists: true,
      dir,
      dist,
      pin,
      manifestChecksum: Hash.sha256(json),
    };
  } catch (cause) {
    return { kind: 'failed', exists, dir, error: Err.std('Dist computation failed.', { cause }) };
  }
};

/**
 * Helpers:
 */

/** Capture descriptive build metadata separately from admitted content identity. */
function createManifest(
  args: t.Pkg.Dist.Compute.Args,
  admitted: StrictManifest,
  policy: IgnorePolicy,
): t.DistPkg {
  const v = Deno.version;
  return {
    type: JsrUrl.Pkg.file(typesPkg, distTypePath),
    ...(args.pkg ? { pkg: args.pkg } : {}),
    hash: admitted.content,
    build: {
      time: Time.now.timestamp,
      size: { total: admitted.totalBytes, pkg: admitted.packageBytes },
      builder: Pkg.toString(args.builder ?? Pkg.unknown()) as t.StringScopedPkgNameVer,
      runtime: `deno=${v.deno}:v8=${v.v8}:typescript=${v.typescript}`,
      hash: {
        policy: JsrUrl.Pkg.file(fsPkg, D.hashPolicy.path),
        ignore: { format: 'gitignore', rules: [...policy.rules], 'rules:digest': policy.digest },
      },
    },
  };
}

/** Bound the exact serialized document before returning or writing it. */
function serializeManifest(dist: t.DistPkg): string {
  const json = Json.stringify(dist, 2);
  if (new TextEncoder().encode(json).byteLength > D.contentLimits.manifestBytes) {
    throw new Error('Dist manifest exceeds its production limit.');
  }
  return json;
}
