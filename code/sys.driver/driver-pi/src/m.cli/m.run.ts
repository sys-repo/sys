import { Fs, type t } from './common.ts';
import { PiArgs } from './u/u.args.ts';
import { toAncestorDiscoveryReadScope } from './u/u.ancestor.discovery.read.ts';
import { runtimeRoot } from './u/u.runtime.ts';
import { Settings } from '../m.core/m.settings/mod.ts';
import { inherit } from './u/u.inherit.ts';

export const run: t.PiCli.Lib['run'] = async (input) => {
  const cwd = input.cwd;
  const root = runtimeRoot(cwd);
  const denoDir = PiArgs.toDenoDir(root);
  const homeDir = PiArgs.toHomeDir(root);
  const env = {
    ...input.env,
    DENO_DIR: denoDir,
    HOME: homeDir,
    PI_CODING_AGENT_DIR: PiArgs.toAgentDir(root),
    PI_SKIP_VERSION_CHECK: '1',
  };

  await Fs.ensureDir(homeDir);
  await Settings.Fs.write({ cwd: root });
  const read = [...(input.read ?? []), ...toAncestorDiscoveryReadScope(cwd)];
  const args = [
    ...(await PiArgs.toArgs(
      root,
      input.args ?? [],
      read,
      input.write ?? [],
      { allowAll: input.allowAll, pkg: input.pkg },
    )),
  ];
  return await inherit({ cmd: 'deno', args, cwd: cwd.invoked, env });
};
