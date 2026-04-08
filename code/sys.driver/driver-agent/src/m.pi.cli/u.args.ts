import { Fs, type t } from './common.ts';
import { resolveRead } from './u.resolve.read.ts';
import { resolveWrite } from './u.resolve.write.ts';

const PI_CLI_TMP_SEGMENTS = ['.tmp', 'pi.cli'] as const;

export const PiArgs = {
  async toPiArgs(cwd: t.StringDir, args: readonly string[]) {
    const denoDir = PiArgs.toDenoDir(cwd);
    const readScope = (await resolveRead(cwd, denoDir)).join(',');
    const writeScope = resolveWrite(cwd).join(',');
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
      'npm:@mariozechner/pi-coding-agent',
      '--no-extensions',
      '--no-skills',
      '--no-prompt-templates',
      ...args,
    ] as const;
  },

  toAgentDir(cwd: t.StringDir) {
    return Fs.join(cwd, ...PI_CLI_TMP_SEGMENTS, 'agent');
  },

  toDenoDir(cwd: t.StringDir) {
    return Fs.join(cwd, ...PI_CLI_TMP_SEGMENTS, 'deno');
  },
} as const;
