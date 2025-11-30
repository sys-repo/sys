import { type t, Crdt, Fs, Pkg, pkg } from '../common.ts';

/**
 * Calculate and save the `dist.json` manifest of the snapshot files.
 */
export async function calcAndSaveDist(dir: t.StringDir, root: t.Crdt.Id) {
  // Generate the `dist.json`:
  const name = `snapshot:${Crdt.Id.toUri(root)}`;
  const dist = (
    await Pkg.Dist.compute({
      dir,
      pkg: { name, version: '0.0.0' },
      save: true,
      builder: pkg,
    })
  ).dist;

  // Save the `dist.json` to the filesystem.
  const path = Fs.join(dir, 'dist.json');
  await Fs.writeJson(path, dist);

  // Finish up.
  return { path, dist } as const;
}
