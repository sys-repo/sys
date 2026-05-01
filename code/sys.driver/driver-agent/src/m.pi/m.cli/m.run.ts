import { Process, type t } from './common.ts';
import { PiArgs } from './u.args.ts';
import { Settings } from '../m.settings/mod.ts';

export const run: t.PiCli.Lib['run'] = async (input) => {
  const cwd = input.cwd;
  const denoDir = PiArgs.toDenoDir(cwd.git);
  const env = {
    ...input.env,
    DENO_DIR: denoDir,
    PI_CODING_AGENT_DIR: PiArgs.toAgentDir(cwd.git),
    PI_SKIP_VERSION_CHECK: '1',
  };

  await Settings.Fs.write({ cwd: cwd.git });
  const args = [
    ...(await PiArgs.toArgs(
      cwd.git,
      input.args ?? [],
      input.read ?? [],
      input.write ?? [],
      { allowAll: input.allowAll, pkg: input.pkg },
    )),
  ];
  return await Process.inherit({ cmd: 'deno', args, cwd: cwd.invoked, env });
};
