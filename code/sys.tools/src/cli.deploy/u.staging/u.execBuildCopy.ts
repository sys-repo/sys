import { type t, Fs, Path, Pkg, Process } from '../common.ts';

/**
 * Build a source directory, then copy its /dist output into the staging area.
 */
export async function execBuildCopy(
  cwd: t.StringDir,
  dir: t.DeployTool.Staging.Dir,
  report?: (e: t.DeployTool.Staging.ProgressReport<'mapping:step'>) => void,
): Promise<void> {
  const srcRoot = Path.resolve(cwd, dir.source);
  const srcDist = Path.join(srcRoot, 'dist');
  const dst = Path.resolve(cwd, dir.staging);

  report?.({ kind: 'mapping:step', label: 'build' });

  // Build (mirrors the known-good pattern in deploy/@tdb.fs).
  const sh = Process.sh({ path: srcRoot, silent: true });
  const res = await sh.run('deno -q task test && deno -q task build');
  if (!res.success) {
    throw new Error(`Failed to build: ${dir.source}\n\n${res.text.stderr}`);
  }

  report?.({ kind: 'mapping:step', label: 'copy dist' });

  // Copy build output → staging.
  await Fs.ensureDir(dst);
  await Fs.copy(srcDist, dst, { force: true });

  report?.({ kind: 'mapping:step', label: 'dist.json' });

  await Pkg.Dist.compute({ dir: dst, save: true });
}
