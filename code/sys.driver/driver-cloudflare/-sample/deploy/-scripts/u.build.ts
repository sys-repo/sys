import {
  BUILD_RECORD_FILENAME,
  configFrom,
  DIST_BATCH_LIMITS,
  DIST_LIMITS,
  partitionBuild,
} from '../src/m.app/u.selection.ts';
import { Fs, Pkg, pkg, type t } from './common.ts';

type Build = (args: {
  readonly root: string;
  readonly publicAssetBase: string;
}) => Promise<{
  readonly ok: boolean;
  readonly manifest?: { readonly integrity: t.StringHash };
  toString(): string;
}>;

/** Build once, project private/public files, and save their manifest pins. */
export async function buildSample(input: t.Config, root: string, build: Build) {
  const config = configFrom(input);
  const buildRecordPath = Fs.join(root, BUILD_RECORD_FILENAME);
  // Invalidate both generations before touching output or invoking the builder.
  await Fs.remove(buildRecordPath);
  await Fs.remove(Fs.join(root, 'dist.selection.json'));
  for (const dir of ['dist', 'dist.private', 'dist.public']) await Fs.remove(Fs.join(root, dir));
  const built = await build(Object.freeze({ root, publicAssetBase: config.publicAssetBase }));
  if (!built.ok || !built.manifest) throw new Error('Sample UI build failed.');
  const projected = await Pkg.Dist.project({
    root,
    source: { dir: 'dist', integrity: built.manifest.integrity },
    outputs: { private: 'dist.private', public: 'dist.public' },
    select: partitionBuild,
    limits: DIST_LIMITS,
    batch: DIST_BATCH_LIMITS,
    pkg,
    builder: pkg,
  });
  if (projected.kind !== 'projected') {
    const residue = projected.remaining.length
      ? ` Remaining: ${projected.remaining.join(', ')}.`
      : '';
    const cleanup = projected.cleanup ? ` Cleanup: ${projected.cleanup}.` : '';
    throw new Error(
      `Sample projection refused: ${projected.phase}/${projected.reason}.${residue}${cleanup}`,
    );
  }
  const selection = Pkg.Dist.Pins.capture({ pins: projected.pins }, {
    names: { private: true, public: true },
  });
  const buildRecord: t.BuildRecord = Object.freeze({
    publicAssetBase: config.publicAssetBase,
    selection,
  });
  await Fs.writeJson(buildRecordPath, buildRecord, { throw: true });
  return { build: built, buildRecord } as const;
}
