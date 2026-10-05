import { type t } from './common.ts';
import { Alias } from './u.alias.ts';
import { init } from './u.apply.ts';
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
import { shellMenu } from './u.menu.ts';
import { Path } from './u.path.ts';

type CliDeps = {
  readonly Alias?: Partial<t.ShellTool.Alias.Lib>;
  readonly Path?: Partial<t.ShellTool.Path.Lib>;
  readonly init?: (options?: t.ShellTool.Apply.Options) => Promise<t.ShellTool.Apply.Report>;
  readonly apply?: (options?: t.ShellTool.Apply.Options) => Promise<t.ShellTool.Apply.Report>;
  readonly doctor?: () => Promise<t.ShellTool.Doctor.Report>;
  readonly shellMenu?: typeof shellMenu;
  readonly info?: (...data: unknown[]) => void;
};

export const cli: t.ShellTool.Lib['cli'] = async (_cwd, argv, context, deps: CliDeps = {}) => {
  const args = parseArgs(argv ?? []);
  const info = deps.info ?? console.info;

  if (args.help) {
    info(await help());
    return;
  }

  if (!args.command) {
    if (args._.length === 0) {
      if (context?.origin === 'root-menu') return await runInteractive(deps);
      return await runDefaultNonInteractive(deps);
    }

    info(await help());
    return;
  }

  return await runParsedCommand(args, deps);
};

/**
 * Helpers:
 */
async function runInteractive(deps: CliDeps): Promise<t.ShellTool.CliResult> {
  const prompt = deps.shellMenu ?? shellMenu;

  while (true) {
    const picked = await prompt();
    if (picked.kind === 'back') return { kind: 'back' };
    await runParsedCommand(parseArgs(picked.argv), deps);
  }
}

async function runDefaultNonInteractive(deps: CliDeps): Promise<t.ShellTool.CliResult> {
  return await runParsedCommand(parseArgs(['doctor']), deps);
}

async function runParsedCommand(
  args: t.ShellTool.CliParsedArgs,
  deps: CliDeps,
): Promise<t.ShellTool.CliResult> {
  const info = deps.info ?? console.info;

  if (args.command === 'doctor') {
    const runDoctor = deps.doctor ?? doctor;
    info(formatDoctor(await runDoctor()));
    return;
  }

  if (args.command === 'init' || args.command === 'apply') {
    const runInit = deps.init ?? deps.apply ?? init;
    info(formatApply(
      await runInit({
        dryRun: Boolean(args['dry-run']),
        profile: stringFlag(args.profile) as t.StringPath | undefined,
        shell: shellFlag(args.shell),
      }),
      'init',
    ));
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
}
