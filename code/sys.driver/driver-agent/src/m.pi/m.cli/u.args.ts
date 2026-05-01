import { Args, Fs, type t } from './common.ts';
import { parseGitRootMode } from './u.git-root.ts';
import { PI_CODING_AGENT_IMPORT, resolvePkg } from './u.resolve.pkg.ts';
import { resolveRead } from './u.resolve.read.ts';
import { resolveWrite } from './u.resolve.write.ts';

type ToArgsOptions = {
  readonly allowAll?: boolean;
  readonly pkg?: t.StringModuleSpecifier;
};

const PI_CLI_TMP_SEGMENTS = ['.tmp', 'pi.cli'] as const;

export const PiArgs = {
  parse(argv: readonly string[] = []): t.PiCli.ParsedArgs {
    const { wrapper, passthrough } = partitionArgv(argv);
    const parsed = Args.parse<
      t.PiCli.ParsedArgs & {
        readonly 'allow-all'?: boolean;
        readonly 'git-root'?: string;
      }
    >(wrapper, {
      boolean: ['help', 'allow-all'],
      string: ['git-root'],
      alias: { h: 'help', A: 'allow-all' },
    });
    const gitRoot = parseGitRootMode(parsed['git-root']);

    return {
      help: parsed.help === true,
      ...(parsed['allow-all'] === true ? { allowAll: true } : {}),
      ...(gitRoot ? { gitRoot } : {}),
      _: parsed.help === true ? [] : passthrough,
    };
  },

  async toArgs(
    cwd: t.StringDir,
    args: readonly string[],
    read: readonly t.StringPath[] = [],
    write: readonly t.StringPath[] = [],
    opts: ToArgsOptions = {},
  ) {
    const denoDir = PiArgs.toDenoDir(cwd);
    const specifier = await resolvePkg({ cwd, pkg: opts.pkg });
    const permissions = opts.allowAll === true
      ? ['--allow-all']
      : await toScopedPermissionArgs(cwd, denoDir, read, write);
    return [
      'run',
      '--no-prompt',
      '--no-lock',
      '--node-modules-dir=none',
      ...permissions,
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

async function toScopedPermissionArgs(
  cwd: t.StringDir,
  denoDir: t.StringDir,
  read: readonly t.StringPath[],
  write: readonly t.StringPath[],
) {
  const readScope = (await resolveRead(cwd, denoDir, read)).join(',');
  const writeScope = (await resolveWrite(cwd, write)).join(',');
  return [
    '--allow-env',
    '--allow-net',
    '--allow-run',
    '--allow-sys=homedir,osRelease,uid',
    `--allow-read=${readScope}`,
    `--allow-write=${writeScope}`,
    `--allow-ffi=${denoDir}`,
  ] as const;
}

function partitionArgv(argv: readonly string[]) {
  const wrapper: string[] = [];
  const passthrough: string[] = [];

  for (let cursor = 0; cursor < argv.length; cursor += 1) {
    const arg = argv[cursor];
    if (arg === '--') {
      passthrough.push(...argv.slice(cursor + 1));
      break;
    }
    if (arg === '-h' || arg === '--help' || arg === '-A' || arg === '--allow-all') {
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
