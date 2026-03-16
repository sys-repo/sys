import { type t, D, Process } from './common.ts';
import { toDeployArgs } from './u.deployArgs.ts';

export const deploy: t.DenoDeploy.Lib['deploy'] = async (request) => {
  try {
    const output = await Process.invoke({
      cmd: D.denoCommand,
      args: toDeployArgs(request),
      cwd: request.stage.root,
      silent: request.silent === true,
    });

    if (output.success) {
      return {
        ok: true,
        code: output.code,
        stdout: output.text.stdout,
        stderr: output.text.stderr,
      };
    }

    return {
      ok: false,
      code: output.code,
      stdout: output.text.stdout,
      stderr: output.text.stderr,
    };
  } catch (error) {
    return { ok: false, error };
  }
};
