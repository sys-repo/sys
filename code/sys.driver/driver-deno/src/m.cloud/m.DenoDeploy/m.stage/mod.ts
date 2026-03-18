import { type t, Fs } from './common.ts';
import { FILE, renderStageEntrypoints } from './-tmpl/mod.ts';
import { buildStageTarget } from './u.buildStageTarget.ts';
import { ensureStageDriverDenoImport } from './u.ensureStageDriverDenoImport.ts';
import { materializeWorkspace } from './u.materializeWorkspace.ts';
import { resolveStageRoot } from './u.resolveStageRoot.ts';
import { resolveStageTarget } from './u.resolveStageTarget.ts';

export const stage: t.DenoDeploy.Lib['stage'] = async (request) => {
  const { workspace, target } = await resolveStageTarget(request);

  const root = await resolveStageRoot(workspace.dir, request.root);
  await buildStageTarget(target.absolute);
  await materializeWorkspace(workspace.dir, root);
  await ensureStageDriverDenoImport(root);

  const rendered = renderStageEntrypoints(target.relative);
  const entry = Fs.join(root, FILE.entry);
  const entryPaths = Fs.join(root, FILE.entryPaths);
  await Fs.write(entry, rendered.entry, { force: true });
  await Fs.write(entryPaths, rendered.entryPaths, { force: true });

  return {
    target: { dir: target.absolute },
    workspace,
    root,
    entry,
  };
};
