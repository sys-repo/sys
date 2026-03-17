import { type t, D, Process } from './common.ts';
import { toDeployArgs } from './u.deployArgs.ts';
import { toDeployMeta } from './u.deployResult.ts';
import { printDeployEnvGuidance, resolveDeployRequestEnv, toDeployEnvNotes } from './u.env.ts';

export const deploy: t.DenoDeploy.Lib['deploy'] = async (request) => {
  try {
    const resolved = resolveDeployRequestEnv(request);
    if (resolved.app.trim().length === 0) {
      if (request.silent !== true) {
        const deployEnv = resolved;
        printDeployEnvGuidance({
          title: 'DENO DEPLOY ENVIRONMENT VARIABLES NOT FOUND',
          what: 'DenoDeploy.deploy needs a target app to run native deploy.',
          why: 'Neither request.app nor DENO_DEPLOY_APP was provided.',
          retry: 'Provide request.app or set DENO_DEPLOY_APP, then retry deploy.',
          notes: toDeployEnvNotes({
            app: 'is required for deploy execution.',
            token: deployEnv.token ? 'is present.' : 'is optional if already authenticated; recommended for headless use.',
            org: deployEnv.org ? 'is present.' : 'is optional when current CLI org context is enough.',
          }),
        });
      }

      return {
        ok: false,
        error: new Error('DenoDeploy.deploy: missing request.app and DENO_DEPLOY_APP'),
      };
    }

    const output = await Process.invoke({
      cmd: D.cmd.deno,
      args: toDeployArgs(resolved),
      cwd: resolved.stage.root,
      silent: resolved.silent === true,
    });

    if (output.success) {
      return {
        ok: true,
        code: output.code,
        stdout: output.text.stdout,
        stderr: output.text.stderr,
        deploy: toDeployMeta({ stdout: output.text.stdout, stderr: output.text.stderr }),
      };
    }

    return {
      ok: false,
      code: output.code,
      stdout: output.text.stdout,
      stderr: output.text.stderr,
      deploy: toDeployMeta({ stdout: output.text.stdout, stderr: output.text.stderr }),
    };
  } catch (error) {
    return { ok: false, error };
  }
};
