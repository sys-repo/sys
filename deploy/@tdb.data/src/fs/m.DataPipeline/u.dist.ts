import { type t, Fs, Pkg } from './common.ts';

/**
 * Refresh the dist metadata for one staged mount directory.
 */
export async function refreshMountDist(dir: t.StringDir): Promise<t.StringFile> {
  await Pkg.Dist.compute({
    dir,
    save: true,
    trustChildDist: true,
  });
  return Fs.join(dir, 'dist.json') as t.StringFile;
}

/**
 * Refresh child mount dist metadata under one staged root.
 */
export async function refreshMountDists(root: t.StringDir): Promise<readonly t.StringFile[]> {
  const paths: t.StringFile[] = [];
  if (!(await Fs.exists(root))) return paths;

  for await (const entry of Fs.walk(root, {
    includeDirs: true,
    includeFiles: false,
    includeSymlinks: false,
    followSymlinks: false,
    maxDepth: 1,
  })) {
    if (entry.path === root || !entry.isDirectory) continue;
    if (!(await Fs.exists(Fs.join(entry.path, 'manifests')))) continue;
    paths.push(await refreshMountDist(entry.path as t.StringDir));
  }

  return paths;
}

/**
 * Refresh the root dist metadata for the staged output tree.
 */
export async function refreshRootDist(root: t.StringDir): Promise<t.StringFile> {
  await Pkg.Dist.compute({
    dir: root,
    save: true,
    trustChildDist: true,
  });
  return Fs.join(root, 'dist.json') as t.StringFile;
}
