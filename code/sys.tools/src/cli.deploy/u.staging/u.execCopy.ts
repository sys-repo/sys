import { type t, Pkg, Fs, Path } from '../common.ts';

/**
 * Copy a source directory into the staging area.
 */
export async function execCopy(
  cwd: t.StringDir,
  dir: t.DeployTool.Staging.Dir,
  report?: (e: t.DeployTool.Staging.ProgressReport<'mapping:step'>) => void,
): Promise<void> {
  const src = Path.resolve(cwd, dir.source);
  const dst = Path.resolve(cwd, dir.staging);

  report?.({ kind: 'mapping:step', label: 'copy' });
  await Fs.ensureDir(dst);
  await Fs.copy(src, dst, { force: true });
  report?.({ kind: 'mapping:step', label: 'dist.json' });

  await Pkg.Dist.compute({ dir: dst, save: true });
}
