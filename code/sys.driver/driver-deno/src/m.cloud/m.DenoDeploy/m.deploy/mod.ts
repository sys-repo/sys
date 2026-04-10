import { type t, Fs, Is, Path, Process } from './common.ts';
import { DeployCli } from '../../u.cli.deploy/mod.ts';
import { toDeployMeta } from './u.deployResult.ts';
import { printDeployEnvGuidance, resolveDeployRequestEnv, toDeployEnvNotes } from './u.env.ts';

export const deploy: t.DenoDeploy.Lib['deploy'] = async (request) => {
  try {
    const resolved = await resolveDeployRequestEnv(request);
    if (resolved.app.trim().length === 0) {
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

      return {
        ok: false,
        error: new Error('DenoDeploy.deploy: missing request.app and DENO_DEPLOY_APP'),
      };
    }

    await wrangle.ensureDeployConfig(resolved);
    const deploy = DeployCli.deploy(resolved);
    const output = await Process.invoke({
      cmd: deploy.cmd,
      args: [...deploy.args],
      cwd: deploy.cwd,
      silent: resolved.log?.process !== true,
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

/**
 * Helpers:
 */
const wrangle = {
  async ensureDeployConfig(request: t.DenoDeploy.Deploy.Request) {
    const configPath = Is.str(request.config) && request.config.trim().length > 0
      ? Path.resolve(request.stage.root, request.config.trim())
      : Fs.join(request.stage.root, 'deno.json');
    const current = (await Fs.readJson<Record<string, unknown>>(configPath)).data;
    if (!current) throw new Error(`Failed to read staged deno.json: ${configPath}`);

    const deploy = Is.record(current.deploy) ? current.deploy : {};
    await Fs.writeJson(configPath, {
      ...current,
      deploy: {
        ...deploy,
        app: request.app,
        ...(request.org ? { org: request.org } : {}),
      },
    });
  },
} as const;
