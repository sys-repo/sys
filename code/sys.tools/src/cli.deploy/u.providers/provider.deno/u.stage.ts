import { DenoDeploy, Fs, Path, type t } from './common.ts';
import { resolveTarget } from './u.resolveTarget.ts';
import { Sidecar } from './u.sidecar.ts';

type RunStageResult =
  | { readonly ok: true; readonly stagingRoot: t.StringDir }
  | { readonly ok: false; readonly error: unknown };

/**
 * Stage a Deno Deploy target into the caller-owned staging root.
 * Never throws unless the caller chooses to rethrow on `ok:false`.
 */
export async function stage(args: {
  cwd: t.StringDir;
  yaml: t.DeployTool.Config.EndpointYaml.Doc;
}): Promise<RunStageResult> {
  try {
    return await stageOrThrow(args);
  } catch (error) {
    return { ok: false, error };
  }
}

async function stageOrThrow(args: {
  cwd: t.StringDir;
  yaml: t.DeployTool.Config.EndpointYaml.Doc;
}): Promise<Extract<RunStageResult, { readonly ok: true }>> {
  const res = resolveTarget(args);
  if (!res.ok) throw new Error(res.hint);

  validateStageRoot({ sourceRootAbs: res.sourceRootAbs, stagingRootAbs: res.stagingRootAbs });
  await prepareStageRoot(res.stagingRootAbs, res.clear);

  const staged = await DenoDeploy.stage({
    target: { dir: res.targetDir },
    root: { kind: 'path', dir: res.stagingRootAbs },
  });
  await Sidecar.write(staged.root, Sidecar.fromStage(staged, res));

  return { ok: true, stagingRoot: staged.root };
}

function validateStageRoot(args: { sourceRootAbs: t.StringDir; stagingRootAbs: t.StringDir }) {
  const sourceRoot = Path.resolve(args.sourceRootAbs, '.');
  const stageRoot = Path.resolve(args.stagingRootAbs, '.');
  const sourcePrefix = Fs.join(sourceRoot, '');

  if (stageRoot === sourceRoot || stageRoot.startsWith(sourcePrefix)) {
    throw new Error(`Deno staging.dir must resolve outside the workspace root '${sourceRoot}'.`);
  }
}

async function prepareStageRoot(stageRoot: t.StringDir, clear: boolean) {
  if (clear) {
    await Fs.remove(stageRoot);
    return;
  }

  if (!(await Fs.exists(stageRoot))) return;

  const entries = await Fs.ls(stageRoot);
  if (entries.length > 0) {
    const err =
      `Deno staging.dir '${stageRoot}' must be empty. Set staging.clear: true or empty it before staging.`;
    throw new Error(err);
  }
}
