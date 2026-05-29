import { Err, type t } from '../common.ts';
import { FmtHelp } from '../u.help/u.mod.ts';
import type { RunContext } from './u.context.ts';
import { serviceModeFlag } from './u.mode.ts';
import { fail, print } from './u.output.ts';

export async function runStart(ctx: RunContext): Promise<t.CellCli.Result> {
  const { args, argv } = ctx;
  const startHelp = await FmtHelp.startOutput();

  if (args.format !== undefined) {
    return fail({ argv }, 'Unexpected option for start: --format', startHelp);
  }
  if (args.help) {
    print(startHelp);
    return { kind: 'help', input: { argv }, text: startHelp };
  }
  if (args.agent || args.dryRun || args.plan || args.force) {
    const flag = args.agent
      ? '--agent'
      : args.dryRun
      ? '--dry-run'
      : args.plan
      ? '--plan'
      : '--force';
    return fail({ argv }, `Unexpected option for start: ${flag}`, startHelp);
  }

  const mode = serviceModeFlag(args.mode, 'start');
  if (!mode.ok) return fail({ argv }, mode.message, startHelp);
  if (args._.length > 2) return fail({ argv }, `Unexpected argument: ${args._[2]}`, startHelp);

  try {
    const { formatStartResult, startCell, toStartResult } = await import('../u/u.start.ts');
    const started = await startCell({
      dir: args._[1],
      mode: mode.value,
      onStarted: print,
    });
    const res = toStartResult({ argv }, started);
    print(formatStartResult(started));
    return res;
  } catch (error) {
    return fail({ argv }, Err.summary(error, { cause: true }));
  }
}
