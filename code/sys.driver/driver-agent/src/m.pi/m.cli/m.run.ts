import { Process, type t } from './common.ts';
import { PiArgs } from './u.args.ts';
import { resolveCwdOrThrow } from './u.resolve.cwd.ts';

export const run: t.PiCli.Lib['run'] = async (input = {}) => {
  const cwd = await resolveCwdOrThrow(input.cwd);
  const denoDir = PiArgs.toDenoDir(cwd.git);
  const env = {
    ...input.env,
    DENO_DIR: denoDir,
    PI_CODING_AGENT_DIR: PiArgs.toAgentDir(cwd.git),
  };

  const args = [...(await PiArgs.toArgs(cwd.git, input.args ?? [], input.read ?? [], input.write ?? [], input.pkg))];
  return await Process.inherit({ cmd: 'deno', args, cwd: cwd.git, env });
};
