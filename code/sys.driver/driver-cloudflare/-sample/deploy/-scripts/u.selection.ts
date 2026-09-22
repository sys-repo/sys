import { DIST_BATCH_LIMITS, DIST_LIMITS, selectionFiles } from '../src/m.app/u.selection.ts';
import { Fs, Pkg, ROOT, type t } from './common.ts';

/** Verify one audience against its saved manifest pin. */
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

/** Check both local distributions and their filenames before a push. */
export async function selectPublication(input: t.DistPins<t.Audience>, root = ROOT) {
  const checked = await Pkg.Dist.Pins.verify({
    root,
    selection: input,
    dirs: { private: 'dist.private', public: 'dist.public' },
    limits: DIST_LIMITS,
    batch: DIST_BATCH_LIMITS,
  });
  if (checked.kind !== 'verified') {
    throw new Error(`Sample ${checked.name ?? 'selection'} Dist refused: ${checked.kind}.`);
  }
  return {
    private: selectionFiles(checked.evidence.private.dist, 'private'),
    public: selectionFiles(checked.evidence.public.dist, 'public'),
  } as const;
}
