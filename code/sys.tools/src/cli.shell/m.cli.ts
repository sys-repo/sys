import { D, Fmt, Fs, type t } from './common.ts';
import { Alias } from './u.alias.ts';
import { parseArgs, shellFlag, stringFlag } from './u.args.ts';
import { doctor } from './u.doctor.ts';
import { formatAliasEnable, formatAliasList, formatDoctor } from './u.fmt.ts';

type CliDeps = {
  readonly Alias?: Partial<typeof Alias>;
  readonly doctor?: typeof doctor;
  readonly info?: (...data: unknown[]) => void;
};

export const cli: t.ShellTool.Lib['cli'] = async (cwd, argv, _context, deps: CliDeps = {}) => {
  cwd = cwd ?? Fs.cwd('terminal');
  const args = parseArgs(argv ?? []);
  const info = deps.info ?? console.info;

  if (args.help || !args.command) {
    info(await help());
    return;
  }

  if (args.command === 'doctor') {
    const runDoctor = deps.doctor ?? doctor;
    info(formatDoctor(await runDoctor()));
    return;
  }

  if (args.command === 'alias' && args.alias?.command === 'list') {
    const runAliasList = deps.Alias?.list ?? Alias.list;
    info(formatAliasList(await runAliasList()));
    return;
  }

  if (args.command === 'alias' && args.alias?.command === 'enable' && args.alias.target) {
    const runAliasEnable = deps.Alias?.enable ?? Alias.enable;
    info(formatAliasEnable(
      await runAliasEnable(args.alias.target, {
        dryRun: Boolean(args['dry-run']),
        apply: Boolean(args.apply),
        profile: stringFlag(args.profile) as t.StringPath | undefined,
        shell: shellFlag(args.shell),
      }),
    ));
    return;
  }

  info(await help());
};

async function help() {
  return await Fmt.help(D.tool.name, {
    usage: [
      `shell doctor`,
      `shell alias list`,
      `shell alias enable <sys|common> --dry-run`,
    ],
    options: [
      ['--dry-run', 'Preview alias changes without writing.'],
      ['--apply', 'Reserved for the apply flow; currently writes nothing.'],
      ['--profile <path>', 'Preview against an explicit profile path.'],
      ['--shell <zsh|bash|posix>', 'Override detected shell dialect for rendering.'],
      ['-h, --help', 'Show help.'],
    ],
    examples: [
      `${Fmt.invoke('shell', 'doctor')}`,
      `${Fmt.invoke('shell', 'alias', 'list')}`,
      `${Fmt.invoke('shell', 'alias', 'enable', 'sys', '--dry-run')}`,
    ],
  });
}
