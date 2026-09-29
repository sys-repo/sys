import {
  BUILD_RECORD_FILENAME,
  configFrom,
  DIST_BATCH_LIMITS,
  DIST_LIMITS,
  partitionBuild,
  readData,
} from '../src/m.deployment/mod.ts';
import { Fs, Is, Obj, Pkg, pkg, ROOT, type t } from './common.ts';
import { formatBuildSelection } from './u.fmt.ts';

type Build = (args: {
  readonly root: string;
  readonly publicAssetBase: string;
}) => Promise<
  & { toString(): string }
  & ({ readonly ok: true; readonly pin: t.DistPin } | { readonly ok: false })
>;

/**
 * Build once, project private/public files, and record the payload total and content pins.
 */
export async function buildSample(input: t.Config, root: string, build: Build) {
  const config = configFrom(input);
  const buildRecordPath = Fs.join(root, BUILD_RECORD_FILENAME);
  // Invalidate both generations before touching output or invoking the builder.
  await Fs.remove(buildRecordPath);
  await Fs.remove(Fs.join(root, 'dist.selection.json'));
  for (const dir of ['dist', 'dist.private', 'dist.public']) await Fs.remove(Fs.join(root, dir));
  const built = await build(Object.freeze({ root, publicAssetBase: config.publicAssetBase }));
  if (!built.ok) throw new Error('Sample UI build failed.');
  let bundleSize: number | undefined;
  const projected = await Pkg.Dist.project({
    root,
    source: { dir: 'dist', pin: built.pin },
    outputs: { private: 'dist.private', public: 'dist.public' },
    select(content) {
      const selection = partitionBuild(content);
      bundleSize = Obj.entries(content.parts).reduce((total, [, part]) => {
        const size = Pkg.Dist.Part.size(part);
        if (size === undefined) throw new Error('Admitted sample part has no size.');
        return total + size;
      }, 0);
      return selection;
    },
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
  if (!Is.num(bundleSize)) throw new Error('Sample bundle size was not captured.');
  const buildRecord: t.BuildRecord = Object.freeze({
    publicAssetBase: config.publicAssetBase,
    bundleSize,
    selection,
  });
  await Fs.writeJson(buildRecordPath, buildRecord, { throw: true });
  return { build: built, buildRecord } as const;
}

if (import.meta.main) {
  const { Vite } = await import('@sys/driver-vite');
  const { APP_ENTRY } = await import('../vite.config.ts');
  const config = configFrom(await readData(Fs.Path.toFileUrl(Fs.join(ROOT, 'r2.config.json'))));
  const result = await buildSample(config, ROOT, async ({ root, publicAssetBase }) => {
    const paths = Vite.Config.paths({
      cwd: root,
      app: { entry: APP_ENTRY, base: publicAssetBase },
    });
    return await Vite.build({ cwd: root, paths, pkg, exitOnError: false });
  });
  console.info(result.build.toString());
  console.info();
  console.info(formatBuildSelection(result.buildRecord.selection));
  console.info();
}
