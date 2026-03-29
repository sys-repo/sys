import { DenoDeploy, type dt, type t } from './common.ts';
import { Sidecar } from './u.sidecar.ts';

export async function push(args: {
  cwd: t.StringDir;
  target: t.DenoPushTarget;
}): Promise<t.PushResult> {
  try {
    const sidecar = await Sidecar.read(args.target.stagingDir);
    const stage = toPrepareStageInput(sidecar);
    const token = resolveToken(args.target.provider);

    console.info(
      DenoDeploy.Fmt.Deploy.config({
        app: args.target.provider.app,
        org: args.target.provider.org,
        token,
        sourceDir: sidecar.target.dir,
        stagedDir: sidecar.root,
      }).join('\n'),
    );

    await DenoDeploy.prepare(stage);
    const res = await DenoDeploy.deploy({
      stage,
      app: args.target.provider.app,
      org: args.target.provider.org,
      token,
      prod: true,
    });

    if (!res.ok) {
      console.info(
        DenoDeploy.Fmt.Deploy.failure({
          phase: 'deploy',
          error: 'error' in res ? res.error : res,
          at: sidecar.root,
        }).join('\n'),
      );
      return {
        ok: false,
        reason: 'failed',
        hint: toDeployFailureHint(res),
        error: 'error' in res ? res.error : res,
      };
    }

    console.info(DenoDeploy.Fmt.Deploy.result(res, 'Deploy Result').join('\n'));
    return { ok: true };
  } catch (error) {
    console.info(
      DenoDeploy.Fmt.Deploy.failure({
        phase: 'deploy',
        error,
        at: args.target.stagingDir,
      }).join('\n'),
    );
    return { ok: false, reason: 'failed', hint: 'deno deploy failed', error };
  }
}

function toPrepareStageInput(
  sidecar: dt.DenoDeploy.Stage.PrepareInput,
): dt.DenoDeploy.Stage.PrepareInput {
  return {
    target: { dir: sidecar.target.dir },
    workspace: { dir: sidecar.workspace.dir },
    root: sidecar.root,
    entry: sidecar.entry,
  };
}

function resolveToken(provider: t.DenoProvider): string | undefined {
  const env = String(provider.tokenEnv ?? '').trim();
  if (!env) return undefined;
  const value = Deno.env.get(env)?.trim();
  return value && value.length > 0 ? value : undefined;
}

function toDeployFailureHint(res: dt.DenoDeploy.Deploy.Result): string {
  if ('error' in res) {
    const msg = res.error instanceof Error ? res.error.message : String(res.error);
    return `deno deploy failed: ${msg}`;
  }

  const stderr = String(res.stderr ?? '').trim();
  const code = String(res.code ?? '');
  return stderr ? `deno deploy failed (exit ${code}): ${stderr}` : `deno deploy failed (exit ${code})`;
}
