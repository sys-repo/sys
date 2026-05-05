import { Fs, Str, type t } from './common.ts';
import { resolveBundleForPull } from './u.bundle/u.defaults.ts';
import { PullFs } from './u.yaml/mod.ts';

/** Resolve pull config materialization targets without pulling remote data. */
export async function resolve(config: t.StringPath): Promise<t.PullTool.ConfigYaml.Resolved> {
  const path = Fs.resolve(config) as t.StringPath;
  const loaded = await PullFs.loadLocation(path);
  if (!loaded.ok) throw new Error(`Pull.resolve: failed to load config: ${path}`);

  const { cwd, location } = loaded;
  const localDirs = (location.bundles ?? []).map((bundle, index) => {
    const effective = resolveBundleForPull(bundle, location.defaults);
    const dir = effective.local.dir;
    return {
      index,
      dir,
      path: Fs.join(location.dir, Str.trimLeadingDotSlash(dir)) as t.StringDir,
      bundle: effective,
    };
  });

  return {
    config: path,
    cwd,
    dir: location.dir,
    localDirs,
  };
}
