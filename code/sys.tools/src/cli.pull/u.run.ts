import { ConfigRef, Fs, type t } from './common.ts';
import { pullConfiguredBundle } from './u.bundle/mod.ts';
import { PullFs } from './u.yaml/mod.ts';

/** Materialize every bundle in one owner config, throwing at the first failed bundle. */
export async function run(args: t.PullTool.RunArgs): Promise<t.PullTool.RunResult> {
  const cwd = args.cwd ?? Fs.cwd('terminal');
  const config = ConfigRef.resolve(cwd, args, 'Pull.run');
  const loaded = await PullFs.loadLocation(config);
  if (!loaded.ok) throw new Error(`Pull.run: failed to load config: ${config}`);

  const bundles: t.PullTool.RunBundleResult[] = [];
  for (const bundle of loaded.location.bundles ?? []) {
    const pulled = await pullConfiguredBundle(loaded.location, bundle, {
      silent: true,
      until: args.until,
    });
    if (!pulled.ok) throw new Error(`Pull.run: ${pulled.error}`);
    if (pulled.bundle.kind === 'dist' && 'kind' in pulled.data && pulled.data.kind === 'dist') {
      bundles.push({ bundle: pulled.bundle, data: pulled.data });
    } else if (pulled.bundle.kind !== 'dist' && 'files' in pulled.data) {
      bundles.push({ bundle: pulled.bundle, data: pulled.data });
    } else {
      throw new Error('Pull.run: bundle result does not match its source kind.');
    }
  }

  return {
    ok: true,
    config,
    cwd: loaded.cwd,
    dir: loaded.location.dir,
    bundles,
  };
}
