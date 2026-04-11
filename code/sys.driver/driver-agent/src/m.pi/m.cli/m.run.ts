import { Fs, Process, type t } from './common.ts';
import { PiArgs } from './u.args.ts';

export const run: t.PiCli.Lib['run'] = async (input = {}) => {
  const cwd = input.cwd ?? Fs.cwd('terminal');
  const denoDir = PiArgs.toDenoDir(cwd);
  const env = {
    ...input.env,
    DENO_DIR: denoDir,
    PI_CODING_AGENT_DIR: PiArgs.toAgentDir(cwd),
  };

  const args = [...(await PiArgs.toArgs(cwd, input.args ?? [], input.read ?? [], input.write ?? [], input.pkg))];
  return await Process.inherit({ cmd: 'deno', args, cwd, env });
};
