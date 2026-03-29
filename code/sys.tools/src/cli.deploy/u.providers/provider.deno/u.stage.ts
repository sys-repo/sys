import { DenoDeploy } from '@sys/driver-deno/cloud';

import { type t, c, Cli, Err, Fs, Path, Str } from '../../common.ts';
import { Fmt } from '../../u.fmt.ts';
import { resolveTarget } from './u.resolveTarget.ts';
import { Sidecar } from './u.sidecar.ts';

type RunStageResult =
  | { readonly ok: true; readonly stagingRoot: t.StringDir }
  | { readonly ok: false; readonly error: unknown };

/**
 * Run DenoDeploy.stage with a stable tools-layer spinner and caller-owned root policy.
 * Never throws unless the caller chooses to rethrow on `ok:false`.
 */
export async function stage(args: {
  cwd: t.StringDir;
  yaml: t.DeployTool.Config.EndpointYaml.Doc;
}): Promise<RunStageResult> {
  const spin = Cli.spinner();
  spin.start(Fmt.spinnerText('Running Deno staging...'));

  try {
    const res = resolveTarget(args);
    if (!res.ok) throw new Error(res.hint);

    validateStageRoot({ sourceRootAbs: res.sourceRootAbs, stagingRootAbs: res.stagingRootAbs });
    await prepareStageRoot(res.stagingRootAbs, res.clear);

    const staged = await DenoDeploy.stage({
      target: { dir: res.targetDir },
      root: { kind: 'path', dir: res.stagingRootAbs },
    });
    await Sidecar.write(staged.root, Sidecar.fromStage(staged, res));

    spin.succeed(Fmt.spinnerText(`${c.green('deno staging complete')} → ${c.white(staged.root)}`));
    return { ok: true, stagingRoot: staged.root };
  } catch (error) {
    spin.fail(Fmt.spinnerText('Deno staging failed'));
    const detail = Err.summary(error, { cause: true, stack: false });
    const body = Str.builder()
      .line(c.red('Deno staging error details'))
      .line(c.gray(c.dim(`error: ${detail}`)));
    console.info(String(body));
    return { ok: false, error };
  }
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
    const err = `Deno staging.dir '${stageRoot}' must be empty. Set staging.clear: true or empty it before staging.`;
    throw new Error(err);
  }
}
