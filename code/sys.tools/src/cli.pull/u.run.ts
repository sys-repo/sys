import { Fs, type t } from './common.ts';
import { pullConfiguredBundle } from './u.bundle/mod.ts';
import { PullFs } from './u.yaml/mod.ts';

/** Pull configured remote bundles from owner YAML. */
export async function run(args: t.PullTool.RunArgs): Promise<t.PullTool.RunResult> {
  const cwd = args.cwd ?? Fs.cwd('terminal');
  const config = Fs.resolve(cwd, args.config) as t.StringPath;
  const loaded = await PullFs.loadLocation(config);
  if (!loaded.ok) throw new Error(`Pull.run: failed to load config: ${config}`);

  const bundles: t.PullTool.RunBundleResult[] = [];
  for (const bundle of loaded.location.bundles ?? []) {
    const pulled = await pullConfiguredBundle(loaded.location, bundle);
    if (!pulled.ok) throw new Error(`Pull.run: ${pulled.error}`);
    bundles.push({ bundle: pulled.bundle, data: pulled.data });
  }

  return {
    ok: true,
    config,
    cwd: loaded.cwd,
    dir: loaded.location.dir,
    bundles,
  };
}
