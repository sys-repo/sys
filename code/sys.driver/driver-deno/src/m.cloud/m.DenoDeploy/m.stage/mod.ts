import { type t, D, Fs } from './common.ts';
import { renderStageEntrypoints } from './-tmpl/mod.ts';
import { buildStageTarget } from './u.buildStageTarget.ts';
import { materializeWorkspace } from './u.materializeWorkspace.ts';
import { resolveStageRoot } from './u.resolveStageRoot.ts';
import { resolveStageTarget } from './u.resolveStageTarget.ts';

export const stage: t.DenoDeploy.Lib['stage'] = async (request) => {
  const { workspace, target } = await resolveStageTarget(request);

  const root = await resolveStageRoot(workspace.dir, request.root);
  await buildStageTarget(target.absolute);
  await materializeWorkspace(workspace.dir, root);

  const entry = Fs.join(root, D.deployEntrypointFilename);
  const rendered = renderStageEntrypoints(target.relative);
  await Fs.write(entry, rendered.entryPaths, { force: true });

  return {
    target: { dir: target.absolute },
    workspace,
    root,
    entry,
  };
};
