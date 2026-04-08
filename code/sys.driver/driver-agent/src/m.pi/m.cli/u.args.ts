import { Fs, type t } from './common.ts';
import { PI_CODING_AGENT_IMPORT, resolvePkg } from './u.resolve.pkg.ts';
import { resolveRead } from './u.resolve.read.ts';
import { resolveWrite } from './u.resolve.write.ts';

const PI_CLI_TMP_SEGMENTS = ['.tmp', 'pi.cli'] as const;

export const PiArgs = {
  async toArgs(
    cwd: t.StringDir,
    args: readonly string[],
    read: readonly t.StringPath[] = [],
    pkg?: t.StringModuleSpecifier,
  ) {
    const denoDir = PiArgs.toDenoDir(cwd);
    const readScope = (await resolveRead(cwd, denoDir, read)).join(',');
    const writeScope = resolveWrite(cwd).join(',');
    const specifier = await resolvePkg({ cwd, pkg });
    return [
      'run',
      '--node-modules-dir=none',
      '--allow-env',
      '--allow-net',
      '--allow-run',
      '--allow-sys=homedir,osRelease,uid',
      `--allow-read=${readScope}`,
      `--allow-write=${writeScope}`,
      `--allow-ffi=${denoDir}`,
      specifier,
      '--no-extensions',
      '--no-skills',
      '--no-prompt-templates',
      ...args,
    ] as const;
  },

  toAgentDir(cwd: t.StringDir) {
    return Fs.join(cwd, '.pi', 'agent');
  },

  toDenoDir(cwd: t.StringDir) {
    return Fs.join(cwd, ...PI_CLI_TMP_SEGMENTS, 'deno');
  },

  import: PI_CODING_AGENT_IMPORT,
} as const;
