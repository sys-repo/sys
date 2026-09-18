import { readData } from '../src/m.app/u.data.ts';
import { artifactFrom, DIST_LIMITS } from '../src/m.app/u.selection.ts';
import { Arr, Fs, Obj, Pkg, ROOT, type t } from './common.ts';

/** Load and verify the recorded local build; never build, repin, or publish. */
export async function selectBuild(root = ROOT): Promise<t.BuildSelection> {
  const artifactUrl = Fs.Path.toFileUrl(Fs.join(root, 'artifact.json'));
  const artifact = artifactFrom(await readData(artifactUrl));
  const { integrity } = artifact;
  const dir = Fs.join(root, 'dist');
  const verify = () => Pkg.Dist.Pinned.verify({ dir, integrity, limits: DIST_LIMITS });
  const verified = await verify();
  if (verified.kind !== 'verified') return verified;

  const files = selectionFiles(verified.evidence.dist);
  if (!Arr.equal(files, [...artifact.files].sort())) return { kind: 'selection-mismatch' };
  return { ...verified, artifact, dir, verify };
}

/** Select declared assets and the manifest itself, which is absent from hash.parts. */
export function selectionFiles(dist: t.DeepReadonly<t.DistPkg>): readonly string[] {
  return [...Obj.keys(dist.hash.parts).map(String), 'dist.json'].sort();
}
