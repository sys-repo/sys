import { Args, Fs, type t } from './common.ts';
import { parseGitRootMode } from './u.git-root.ts';
import { PI_CODING_AGENT_IMPORT, resolvePkg } from './u.resolve.pkg.ts';
import { resolveRead } from './u.resolve.read.ts';
import { resolveWrite } from './u.resolve.write.ts';

const PI_CLI_TMP_SEGMENTS = ['.tmp', 'pi.cli'] as const;

export const PiArgs = {
  parse(argv: readonly string[] = []): t.PiCli.ParsedArgs {
    const { wrapper, passthrough } = partitionArgv(argv);
    const parsed = Args.parse<t.PiCli.ParsedArgs & { readonly 'git-root'?: string }>(wrapper, {
      boolean: ['help'],
      string: ['git-root'],
      alias: { h: 'help' },
    });
    const gitRoot = parseGitRootMode(parsed['git-root']);

    return {
      help: parsed.help === true,
      ...(gitRoot ? { gitRoot } : {}),
      _: parsed.help === true ? [] : passthrough,
    };
  },

  async toArgs(
    cwd: t.StringDir,
    args: readonly string[],
    read: readonly t.StringPath[] = [],
    write: readonly t.StringPath[] = [],
    pkg?: t.StringModuleSpecifier,
  ) {
    const denoDir = PiArgs.toDenoDir(cwd);
    const readScope = (await resolveRead(cwd, denoDir, read)).join(',');
    const writeScope = (await resolveWrite(cwd, write)).join(',');
    const specifier = await resolvePkg({ cwd, pkg });
    return [
      'run',
      '--no-prompt',
      '--no-lock',
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

function partitionArgv(argv: readonly string[]) {
  const wrapper: string[] = [];
  const passthrough: string[] = [];

  for (let cursor = 0; cursor < argv.length; cursor += 1) {
    const arg = argv[cursor];
    if (arg === '--') {
      passthrough.push(...argv.slice(cursor + 1));
      break;
    }
    if (arg === '-h' || arg === '--help') {
      wrapper.push(arg);
      continue;
    }
    if (arg === '--git-root') {
      const value = argv[cursor + 1];
      wrapper.push(arg);
      if (value) {
        wrapper.push(value);
        cursor += 1;
      }
      continue;
    }
    if (arg.startsWith('--git-root=')) {
      wrapper.push(arg);
      continue;
    }
    passthrough.push(arg);
  }

  return { wrapper, passthrough };
}
