import { type t, Pkg, Path } from '../common.ts';
import { copyInto } from './u.copyInto.ts';
import { ensureIndexHtml } from './u.generateHtml.ts';

/**
 * Copy a source directory into the staging area.
 */
export async function execCopy(
  cwd: t.StringDir,
  dir: t.DeployTool.Staging.Dir,
  report?: (e: t.DeployTool.Staging.ProgressReport<'mapping:step'>) => void,
  options: { readonly overwrite?: boolean; readonly buildResetToken?: string } = {},
): Promise<void> {
  const { overwrite = false, buildResetToken } = options;

  const sourceRaw = String(dir.source ?? '');
  const stagingRaw = String(dir.staging ?? '');

  const src = Path.Is.absolute(sourceRaw) ? sourceRaw : Path.resolve(cwd, sourceRaw);
  const dst = Path.Is.absolute(stagingRaw) ? stagingRaw : Path.resolve(cwd, stagingRaw);

  report?.({ kind: 'mapping:step', label: 'copy' });
  await copyInto({ src, dst, overwrite });

  await ensureIndexHtml(dst, { buildResetToken });

  report?.({ kind: 'mapping:step', label: 'dist.json' });
  await Pkg.Dist.compute({ dir: dst, save: true });
}
