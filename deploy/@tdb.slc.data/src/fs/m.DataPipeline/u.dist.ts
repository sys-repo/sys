import { type t, Fs, Pkg } from './common.ts';

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
