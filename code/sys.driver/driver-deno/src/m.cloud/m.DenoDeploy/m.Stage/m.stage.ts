import { type t, D, Fs, Path } from './common.ts';
import { createStageEntrypoint } from './u.createStageEntrypoint.ts';
import { materializeWorkspace } from './u.materializeWorkspace.ts';
import { resolveStageRoot } from './u.resolveStageRoot.ts';
import { resolveStageTarget } from './u.resolveStageTarget.ts';
import { resolveTargetEntry } from './u.resolveTargetEntry.ts';

export const stage: t.DenoDeploy.Lib['stage'] = async (request) => {
  const { workspace, targetDir, targetRootRel } = await resolveStageTarget(request);

  const root = await resolveStageRoot(workspace.dir, request.root);
  await materializeWorkspace(workspace.dir, root);

  const stagedTargetDir = targetRootRel === '.' ? root : Fs.join(root, targetRootRel);
  const targetEntry = await resolveTargetEntry(stagedTargetDir);
  const entry = Fs.join(root, D.deployEntrypointFilename);
  await Fs.write(
    entry,
    createStageEntrypoint(Path.relative(root, targetEntry.path), {
      hasDefaultExport: targetEntry.hasDefaultExport,
    }),
    { force: true },
  );

  return {
    target: { dir: targetDir },
    workspace,
    root,
    entry,
  };
};
