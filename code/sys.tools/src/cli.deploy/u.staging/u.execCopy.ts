import { type t, Fs, Path } from '../common.ts';

/**
 * Copy a source directory into the staging area.
 */
export async function execCopy(cwd: t.StringDir, dir: t.DeployTool.Staging.Dir): Promise<void> {
  const src = Path.resolve(cwd, dir.source);
  const dst = Path.resolve(cwd, dir.staging);
  await Fs.ensureDir(dst);
  await Fs.copy(src, dst, { force: true });
}
