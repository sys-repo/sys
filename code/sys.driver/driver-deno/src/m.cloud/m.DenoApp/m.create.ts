import { type t, Process } from './common.ts';
import { DeployCli } from '../u.cli.deploy/mod.ts';

export const create: t.DenoApp.Lib['create'] = async (request) => {
  try {
    const cli = DeployCli.create(request);
    const output = await Process.invoke({
      cmd: cli.cmd,
      args: [...cli.args],
      cwd: cli.cwd,
      silent: wrangle.log(request.log)?.process !== true,
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

/**
 * Helpers:
 */
const wrangle = {
  log(input?: boolean | t.DenoApp.Create.Log) {
    if (input === true) return { process: true } satisfies t.DenoApp.Create.Log;
    if (input === false || input === undefined) return undefined;
    return input;
  },
} as const;
