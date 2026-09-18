import { DIST_LIMITS, selectionFiles } from '../src/m.app/u.selection.ts';
import { Fs, Pkg, ROOT, type t } from './common.ts';

/** Verify local bytes against the captured pin; never reload metadata or select a new build. */
export async function selectBuild(pin: t.DistPin, root = ROOT): Promise<t.BuildSelection> {
  if (!Pkg.Is.distPin(pin)) throw new Error('Invalid sample Dist pin.');
  const integrity = pin['dist.json'];
  const dir = Fs.resolve(root, 'dist');
  const verify = () => Pkg.Dist.Pinned.verify({ dir, integrity, limits: DIST_LIMITS });
  const verified = await verify();
  if (verified.kind !== 'verified') return verified;
  const files = selectionFiles(verified.evidence.dist);
  return { ...verified, files, dir, verify };
}
