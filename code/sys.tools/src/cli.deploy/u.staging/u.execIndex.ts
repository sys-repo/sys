import { type t, Fs, Path, Pkg } from '../common.ts';
import { ensureIndexHtml } from './u.generateHtml.ts';

/**
 * Generate an index.html + dist.json into the staging target.
 */
export async function execIndex(
  cwd: t.StringDir,
  dir: t.DeployTool.Staging.Dir,
  report?: (e: t.DeployTool.Staging.ProgressReport<'mapping:step'>) => void,
  stagingRoot?: t.StringDir,
  baseDomain?: string,
  buildResetToken?: string,
): Promise<void> {
  const sourceRaw = String(dir.source ?? '');
  const stagingRaw = String(dir.staging ?? '');

  const base = stagingRoot ?? cwd;
  const src = Path.Is.absolute(sourceRaw) ? sourceRaw : Path.resolve(base, sourceRaw);
  const dst = Path.Is.absolute(stagingRaw) ? stagingRaw : Path.resolve(cwd, stagingRaw);

  report?.({ kind: 'mapping:step', label: 'index.html' });
  await Fs.ensureDir(dst);
  await ensureIndexHtml(src, { force: true, baseDomain, buildResetToken });
  await Fs.copy(Fs.join(src, 'index.html'), Fs.join(dst, 'index.html'), { force: true });

  report?.({ kind: 'mapping:step', label: 'dist.json' });
  await Pkg.Dist.compute({ dir: dst, save: true });
}
