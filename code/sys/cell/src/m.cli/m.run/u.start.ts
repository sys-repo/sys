import { Err, type t } from '../common.ts';
import { FmtHelp } from '../u.help/u.mod.ts';
import type { RunContext } from './u.context.ts';
import { serviceModeFlag } from './u.mode.ts';
import { fail, print } from './u.output.ts';
import { startReporterFlag } from './u.reporter.ts';

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
  const reporter = startReporterFlag(args.reporter);
  if (!reporter.ok) return fail({ argv }, reporter.message, startHelp);
  if (args._.length > 2) return fail({ argv }, `Unexpected argument: ${args._[2]}`, startHelp);

  try {
    const start = await import('../u/u.start.ts');
    const reporting = await import('../u/u.start.reporter.ts');
    const output = reporting.StartReporter.create(reporter.value);

    try {
      output.open();
      const started = await start.startCell({
        dir: args._[1],
        mode: mode.value,
        onStarting: output.starting,
        onReady: output.ready,
      });
      const res = start.toStartResult({ argv }, started);
      output.complete(start.formatStartResult(started));
      output.dispose();
      return res;
    } catch (error) {
      try {
        output.dispose();
      } catch {
        // Preserve the start/reporter failure that triggered cleanup.
      }
      throw error;
    }
  } catch (error) {
    return fail({ argv }, Err.summary(error, { cause: true }));
  }
}
