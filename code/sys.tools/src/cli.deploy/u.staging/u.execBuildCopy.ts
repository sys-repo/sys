import { type t, Fs, Path, Pkg, Process } from '../common.ts';
import { copyInto } from './u.copyInto.ts';
import { ensureIndexHtml } from './u.generateHtml.ts';

/**
 * Build a source directory, then copy its /dist output into the staging area.
 */
export async function execBuildCopy(
  cwd: t.StringDir,
  dir: t.DeployTool.Staging.Dir,
  report?: (e: t.DeployTool.Staging.ProgressReport<'mapping:step'>) => void,
  options: { readonly overwrite?: boolean } = {},
): Promise<void> {

  const sourceRaw = String(dir.source ?? '');
  const stagingRaw = String(dir.staging ?? '');

  const srcRoot = Path.Is.absolute(sourceRaw) ? sourceRaw : Path.resolve(cwd, sourceRaw);
  const dst = Path.Is.absolute(stagingRaw) ? stagingRaw : Path.resolve(cwd, stagingRaw);
  const srcDist = Fs.join(srcRoot, 'dist');

  const reportStep = (label: string) => report?.({ kind: 'mapping:step', label });
  reportStep('build');

  const sh = Process.sh({ path: srcRoot, silent: true });
  const res = await sh.run('deno -q task test && deno -q task build');
  if (!res.success) {
    throw new Error(`Failed to build: ${dir.source}\n\n${res.text.stderr}`);
  }

  reportStep('sync into staging');
  await copyInto({
    src: srcDist,
    dst,
    // Build outputs should always reflect the latest compile state.
    overwrite: true,
    sync: true,
  });

  reportStep('index.html');
  await ensureIndexHtml(dst);

  reportStep('dist.json');
  await Pkg.Dist.compute({ dir: dst, save: true });
}
