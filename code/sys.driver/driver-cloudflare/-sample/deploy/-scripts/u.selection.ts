import { DIST_LIMITS, selectionFiles, selectionFrom } from '../src/m.app/u.selection.ts';
import { Fs, Pkg, ROOT, type t } from './common.ts';

/** Verify local bytes against the captured pin; never reload metadata or select a new build. */
export async function selectBuild(
  pin: t.DistPin,
  root = ROOT,
  audience: t.Audience = 'private',
): Promise<t.BuildSelection> {
  if (!Pkg.Is.distPin(pin)) throw new Error('Invalid sample Dist pin.');
  const integrity = pin['dist.json'];
  const dir = Fs.resolve(root, `dist.${audience}`);
  const verify = () => Pkg.Dist.Pinned.verify({ dir, integrity, limits: DIST_LIMITS });
  const verified = await verify();
  if (verified.kind !== 'verified') return verified;
  const files = selectionFiles(verified.evidence.dist, audience);
  return { ...verified, files, dir, verify };
}

/** Both projections must match one captured selection before either target may publish. */
export async function selectPublication(input: t.Selection, root = ROOT) {
  const selection = selectionFrom(input);
  const privateBuild = await selectBuild(selection.private, root, 'private');
  if (privateBuild.kind !== 'verified') {
    throw new Error(`Sample private Dist refused: ${privateBuild.kind}.`);
  }
  const publicBuild = await selectBuild(selection.public, root, 'public');
  if (publicBuild.kind !== 'verified') {
    throw new Error(`Sample public Dist refused: ${publicBuild.kind}.`);
  }
  return { private: privateBuild, public: publicBuild } as const;
}
