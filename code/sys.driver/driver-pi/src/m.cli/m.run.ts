import { Fs, type t } from './common.ts';
import { PiArgs } from './u/u.args.ts';
import { toAncestorDiscoveryReadScope } from './u/u.ancestor.discovery.read.ts';
import { runtimeRoot } from './u/u.runtime.ts';
import { Settings } from '../m.core/m.settings/mod.ts';
import { inherit } from './u/u.inherit.ts';
import { removePreload, writePreload } from './u/u.preload.ts';
import { resolvePkg } from './u/u.resolve.pkg.ts';

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
  const pkg = await resolvePkg({ cwd: root, pkg: input.pkg });
  const preload = await writePreload(PiArgs.toTmpDir(root), pkg);
  let args: string[];
  try {
    const options = { allowAll: input.allowAll, pkg, preload: preload?.path };
    const argv = await PiArgs.toArgs(root, input.args ?? [], read, input.write ?? [], options);
    args = [...argv];
  } catch (error) {
    if (preload) await removePreload(preload.dir);
    throw error;
  }

  let result: t.Process.InheritOutput;
  try {
    result = await inherit({ cmd: 'deno', args, cwd: cwd.invoked, env });
  } catch (error) {
    // This boundary cannot distinguish failed spawn from uncertain child settlement.
    if (preload) console.info(`Pi launch/status failed; preload retained at: ${preload.dir}`);
    throw error;
  }
  // Process.inherit fulfills only after child.status settles, including nonzero/signal exits.
  if (preload) await removePreload(preload.dir);
  return result;
};
