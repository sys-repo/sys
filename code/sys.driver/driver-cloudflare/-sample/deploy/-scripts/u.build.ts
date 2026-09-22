import { configFrom, DIST_LIMITS, selectionFiles } from '../src/m.app/u.selection.ts';
import { Fs, Obj, Pkg, pkg, type t } from './common.ts';
import { selectPublication } from './u.selection.ts';

type Build = (args: {
  readonly root: string;
  readonly publicAssetBase: string;
}) => Promise<{ readonly ok: boolean; toString(): string }>;

/** One normal Vite build, then byte-preserving projections through the existing Dist owner. */
export async function buildSample(input: t.Config, root: string, build: Build) {
  const config = configFrom(input);
  const selectionPath = Fs.join(root, 'dist.selection.json');
  // A failed attempt must not leave an old selection advertising a new candidate.
  await Fs.remove(selectionPath);
  await Fs.remove(Fs.join(root, 'dist.private'));
  await Fs.remove(Fs.join(root, 'dist.public'));
  const built = await build(Object.freeze({ root, publicAssetBase: config.publicAssetBase }));
  if (!built.ok) throw new Error('Sample UI build failed.');

  const source = Fs.join(root, 'dist');
  const verified = await Pkg.Dist.Local.verify({ dir: source, limits: DIST_LIMITS });
  if (verified.kind !== 'verified') throw new Error(`Sample Dist refused: ${verified.kind}.`);
  const files = selectionFiles(verified.evidence.dist, 'build');
  const pins: Partial<Record<t.Audience, t.DistPin>> = {};

  for (const audience of ['private', 'public'] as const) {
    const dir = Fs.join(root, `dist.${audience}`);
    const payloads = files.filter((path) =>
      path !== 'dist.json' &&
      (audience === 'private' ? path === 'index.html' : path !== 'index.html')
    );
    for (const path of payloads) {
      const part = Pkg.Dist.Part.parse(verified.evidence.dist.hash.parts[path]);
      if (!part || part.size === undefined) throw new Error('Sample build part lacks a size.');
      const read = await Pkg.Dist.Pinned.readPart({
        dir: source,
        path,
        checksum: part.hash,
        size: part.size,
      });
      if (read.kind !== 'read') throw new Error(`Sample build part refused: ${read.kind}.`);
      await Fs.write(Fs.join(dir, path), read.bytes, { throw: true });
    }
    const computed = await Pkg.Dist.compute({ dir, pkg, builder: pkg, save: true });
    if (computed.error) throw new Error('Sample projection manifest generation failed.');
    const projected = await Pkg.Dist.Local.verify({ dir, limits: DIST_LIMITS });
    if (projected.kind !== 'verified') {
      throw new Error(`Sample ${audience} Dist refused: ${projected.kind}.`);
    }
    selectionFiles(projected.evidence.dist, audience);
    if (
      payloads.length !== Obj.keys(projected.evidence.dist.hash.parts).length ||
      payloads.some((path) =>
        projected.evidence.dist.hash.parts[path] !== verified.evidence.dist.hash.parts[path]
      )
    ) throw new Error('Sample projection changed the selected payloads.');
    pins[audience] = { 'dist.json': projected.evidence.integrity };
  }

  if (!pins.private || !pins.public) throw new Error('Sample build projections are incomplete.');
  const selection: t.Selection = Obj.deepFreeze({
    private: pins.private,
    public: pins.public,
    publicAssetBase: config.publicAssetBase,
  });
  await selectPublication(selection, root);
  const rechecked = await Pkg.Dist.Pinned.verify({
    dir: source,
    integrity: verified.evidence.integrity,
    limits: DIST_LIMITS,
  });
  if (rechecked.kind !== 'verified') throw new Error('Sample build changed during projection.');
  await Fs.writeJson(selectionPath, selection, { throw: true });
  return { build: built, selection } as const;
}
