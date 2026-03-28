import { type t, Path } from './common.ts';
import { DenoFile } from '../../../m.runtime/mod.ts';

type Response = {
  readonly workspace: t.DenoWorkspace;
  readonly target: {
    readonly absolute: t.StringDir;
    readonly relative: t.StringRelativeDir;
  };
};

export async function resolveStageTarget(request: t.DenoDeploy.Stage.Request): Promise<Response> {
  const targetDir = Path.resolve(request.target.dir);
  const workspaceFile = await DenoFile.nearest(targetDir, (e) => Array.isArray(e.file.workspace));
  if (!workspaceFile) {
    throw new Error(`DenoDeploy.stage: no workspace found for target dir '${targetDir}'`);
  }

  const workspace = await DenoFile.workspace(workspaceFile.path, { walkup: false });
  if (!workspace.exists) {
    throw new Error(`DenoDeploy.stage: workspace does not exist for '${workspaceFile.path}'`);
  }

  const target = await DenoFile.load(targetDir);
  if (!target.exists || !target.data) {
    const err = `DenoDeploy.stage: target dir '${targetDir}' does not contain a deno.json file`;
    throw new Error(err);
  }

  const targetRootRel = Path.relative(workspace.dir, targetDir);
  if (targetRootRel.startsWith('..')) {
    const err = `DenoDeploy.stage: target dir '${targetDir}' is outside workspace '${workspace.dir}'`;
    throw new Error(err);
  }

  if (
    targetRootRel !== '.' &&
    !workspace.children.some((child) => child.path.dir === targetRootRel)
  ) {
    const err = `DenoDeploy.stage: target dir '${targetDir}' is not a declared workspace child of '${workspace.dir}'`;
    throw new Error(err);
  }

  return {
    workspace,
    target: {
      absolute: targetDir,
      relative: ensureDotRelativeDir(targetRootRel),
    },
  };
}

function ensureDotRelativeDir(dir: t.StringPath) {
  return (dir.startsWith('./') ? dir : `./${dir}`) as t.StringRelativeDir;
}
