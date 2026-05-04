import { Fs, Process, type t } from './common.ts';
import { PiArgs } from './u.args.ts';
import { toAncestorDiscoveryReadScope } from './u.ancestor.discovery.read.ts';
import { Settings } from '../m.settings/mod.ts';

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
  return await Process.inherit({ cmd: 'deno', args, cwd: cwd.invoked, env });
};

function runtimeRoot(cwd: t.PiCli.Cwd): t.StringDir {
  const root = cwd.root ?? cwd.git;
  if (!root) throw new Error('Pi run requires a resolved runtime root.');
  return root;
}
