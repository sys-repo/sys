import { DenoDeploy, type t, Path } from './common.ts';
import { classifyDeployFailure } from './u.classifyDeployFailure.ts';
import { Sidecar } from './u.sidecar.ts';

export async function push(args: {
  cwd: t.StringDir;
  target: t.DenoPushTarget;
}): Promise<t.PushResult> {
  try {
    const sidecar = await Sidecar.read(args.target.stagingDir);
    const stage = toPrepareStageInput(sidecar);
    const token = resolveToken(args.target.provider);

    print(DenoDeploy.Fmt.Deploy.config({
      app: args.target.provider.app,
      org: args.target.provider.org,
      token,
      sourceDir: sidecar.target.dir,
      stagedDir: sidecar.root,
    }));

    await DenoDeploy.prepare(stage);
    const first = await DenoDeploy.deploy({
      stage,
      app: args.target.provider.app,
      org: args.target.provider.org,
      token,
      prod: true,
    });

    if (first.ok) {
      print(DenoDeploy.Fmt.Deploy.result(first, 'Deploy Result'));
      return { ok: true };
    }

    const classified = classifyDeployFailure(first);
    if (classified.kind !== 'missing-app') {
      return failDeploy({ at: sidecar.root, result: first });
    }

    console.info('Deno Deploy app was not found. Creating it from the staged artifact root...');
    const created = await DenoDeploy.App.create(toCreateRequest({
      provider: args.target.provider,
      token,
      sidecar,
    }));
    if (!created.ok) {
      return failCreate(created);
    }

    const retry = await DenoDeploy.deploy({
      stage,
      app: args.target.provider.app,
      org: args.target.provider.org,
      token,
      prod: true,
    });
    if (!retry.ok) {
      return failDeploy({ at: sidecar.root, result: retry });
    }

    print(DenoDeploy.Fmt.Deploy.result(retry, 'Deploy Result'));
    return { ok: true };
  } catch (error) {
    print(DenoDeploy.Fmt.Deploy.failure({
      phase: 'deploy',
      error,
      at: args.target.stagingDir,
    }));
    return { ok: false, reason: 'failed', hint: 'deno deploy failed', error };
  }
}

function toPrepareStageInput(
  sidecar: t.DenoDeploy.Stage.PrepareInput,
): t.DenoDeploy.Stage.PrepareInput {
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

function toCreateRequest(args: {
  provider: t.DenoProvider;
  token?: string;
  sidecar: t.DenoDeploy.Stage.PrepareInput;
}): t.DenoApp.Create.Request {
  return {
    root: args.sidecar.root,
    app: args.provider.app,
    org: args.provider.org,
    token: args.token,
    noWait: true,
    doNotUseDetectedBuildConfig: true,
    appDirectory: './',
    installCommand: 'true',
    buildCommand: 'true',
    preDeployCommand: 'true',
    runtimeMode: 'dynamic',
    entrypoint: `./${Path.relative(args.sidecar.root, args.sidecar.entry)}`,
    workingDirectory: './',
  };
}

function failDeploy(args: {
  at: t.StringDir;
  result: t.DenoDeploy.Deploy.Result;
}): t.PushResult {
  print(DenoDeploy.Fmt.Deploy.failure({
    phase: 'deploy',
    error: 'error' in args.result ? args.result.error : args.result,
    at: args.at,
  }));
  return {
    ok: false,
    reason: 'failed',
    hint: toDeployFailureHint(args.result),
    error: 'error' in args.result ? args.result.error : args.result,
  };
}

function toDeployFailureHint(res: t.DenoDeploy.Deploy.Result): string {
  if ('error' in res) {
    const msg = res.error instanceof Error ? res.error.message : String(res.error);
    return `deno deploy failed: ${msg}`;
  }

  const stderr = String(res.stderr ?? '').trim();
  const code = String(res.code ?? '');
  return stderr ? `deno deploy failed (exit ${code}): ${stderr}` : `deno deploy failed (exit ${code})`;
}

function toCreateFailureHint(res: t.DenoApp.Create.Result): string {
  if ('error' in res) {
    const msg = res.error instanceof Error ? res.error.message : String(res.error);
    return `deno app create failed: ${msg}`;
  }

  const stderr = String(res.stderr ?? '').trim();
  const code = String(res.code ?? '');
  return stderr ? `deno app create failed (exit ${code}): ${stderr}` : `deno app create failed (exit ${code})`;
}

function failCreate(result: t.DenoApp.Create.Result): t.PushResult {
  print(DenoDeploy.Fmt.Deploy.failure({
    phase: 'create app',
    error: 'error' in result ? result.error : result,
  }));
  return {
    ok: false,
    reason: 'failed',
    hint: toCreateFailureHint(result),
    error: 'error' in result ? result.error : result,
  };
}

function print(lines: readonly string[]) {
  console.info(lines.join('\n'));
}
