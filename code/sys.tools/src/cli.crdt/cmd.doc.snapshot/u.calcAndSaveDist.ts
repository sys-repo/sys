import { Crdt, Fs, Pkg, pkg, type t } from '../common.ts';

/**
 * Calculate and save the `dist.json` manifest of the snapshot files.
 */
export async function calcAndSaveDist(dir: t.StringDir, root: t.Crdt.Id) {
  // Generate the `dist.json`:
  const name = `snapshot:${Crdt.Id.toUri(root)}`;
  const computed = await Pkg.Dist.compute({
    dir,
    pkg: { name, version: '0.0.0' },
    save: true,
    builder: pkg,
  });
  if (computed.kind !== 'computed') throw computed.error;
  const { dist } = computed;
  const path = Fs.join(dir, 'dist.json');

  // Finish up.
  return { path, dist } as const;
}
