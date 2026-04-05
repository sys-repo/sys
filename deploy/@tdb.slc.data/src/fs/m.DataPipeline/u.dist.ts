import { type t, Pkg } from './common.ts';

/**
 * Refresh the root dist metadata for the staged output tree.
 */
export async function refreshRootDist(root: t.StringDir): Promise<void> {
  await Pkg.Dist.compute({
    dir: root,
    save: true,
    trustChildDist: true,
  });
}
