import { Fs, Str, type t } from './common.ts';
import { validateBundleIsolation } from './u.bundle/u.isolation.ts';
import { PullFs } from './u.yaml/mod.ts';

/** Resolve configured mutable outputs without network or filesystem mutation. */
export async function resolve(config: t.StringPath): Promise<t.PullTool.ConfigYaml.Resolved> {
  const path = Fs.resolve(config) as t.StringPath;
  const loaded = await PullFs.loadLocation(path);
  if (!loaded.ok) throw new Error(`Pull.resolve: failed to load config: ${path}`);

  const { cwd, location } = loaded;
  const isolation = validateBundleIsolation(location);
  if (!isolation.ok) throw new Error(`Pull.resolve: ${isolation.error}`);

  const localDirs = (location.bundles ?? []).flatMap((bundle, index) => {
    const dir = bundle.kind === 'dist' ? bundle.project?.dir : bundle.local.dir;
    return dir
      ? [{
        index,
        dir,
        path: Fs.join(location.dir, Str.trimLeadingDotSlash(dir)) as t.StringDir,
        bundle,
      }]
      : [];
  });

  return {
    config: path,
    cwd,
    dir: location.dir,
    localDirs,
  };
}
