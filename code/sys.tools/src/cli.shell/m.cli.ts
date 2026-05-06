import { Fs, type t } from './common.ts';
import { Alias } from './u.alias.ts';
import { apply } from './u.apply.ts';
import { parseArgs, shellFlag, stringFlag } from './u.args.ts';
import { doctor } from './u.doctor.ts';
import {
  formatAliasEnable,
  formatAliasList,
  formatApply,
  formatDoctor,
  formatPathAdd,
  formatPathList,
} from './u.fmt.ts';
import { help } from './u.help.ts';
import { Path } from './u.path.ts';

type CliDeps = {
  readonly Alias?: Partial<t.ShellTool.Alias.Lib>;
  readonly Path?: Partial<t.ShellTool.Path.Lib>;
  readonly apply?: (options?: t.ShellTool.Apply.Options) => Promise<t.ShellTool.Apply.Report>;
  readonly doctor?: () => Promise<t.ShellTool.Doctor.Report>;
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

  if (args.command === 'apply') {
    const runApply = deps.apply ?? apply;
    info(formatApply(await runApply({
      dryRun: Boolean(args['dry-run']),
      profile: stringFlag(args.profile) as t.StringPath | undefined,
      shell: shellFlag(args.shell),
    })));
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
        profile: stringFlag(args.profile) as t.StringPath | undefined,
        shell: shellFlag(args.shell),
      }),
    ));
    return;
  }

  if (args.command === 'path' && args.path?.command === 'list') {
    const runPathList = deps.Path?.list ?? Path.list;
    info(formatPathList(await runPathList()));
    return;
  }

  if (args.command === 'path' && args.path?.command === 'add' && args.path.target) {
    const runPathAdd = deps.Path?.add ?? Path.add;
    info(formatPathAdd(
      await runPathAdd(args.path.target, {
        dryRun: Boolean(args['dry-run']),
        profile: stringFlag(args.profile) as t.StringPath | undefined,
        shell: shellFlag(args.shell),
      }),
    ));
    return;
  }

  info(await help());
};
