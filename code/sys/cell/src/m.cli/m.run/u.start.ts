import { Err, type t } from '../common.ts';
import { FmtHelp } from '../u.help/u.mod.ts';
import type { RunContext } from './u.context.ts';
import { serviceModeFlag } from './u.mode.ts';
import { fail, print } from './u.output.ts';
import { startReporterFlag } from './u.reporter.ts';

export async function runStart(ctx: RunContext): Promise<t.CellCli.Result> {
  const { args, input } = ctx;
  const startHelp = await FmtHelp.startOutput();

  if (args.format !== undefined) {
    return fail(input, 'Unexpected option for start: --format', startHelp);
  }
  if (args.help) {
    print(startHelp);
    return { kind: 'help', input, text: startHelp };
  }
  if (args.agent || args.dryRun || args.plan || args.force) {
    const flag = args.agent
      ? '--agent'
      : args.dryRun
      ? '--dry-run'
      : args.plan
      ? '--plan'
      : '--force';
    return fail(input, `Unexpected option for start: ${flag}`, startHelp);
  }

  const mode = serviceModeFlag(args.mode, 'start');
  if (!mode.ok) return fail(input, mode.message, startHelp);
  const reporter = startReporterFlag(args.reporter);
  if (!reporter.ok) return fail(input, reporter.message, startHelp);
  if (args._.length > 2) return fail(input, `Unexpected argument: ${args._[2]}`, startHelp);

  try {
    const start = await import('../u/u.start.ts');
    const reporting = await import('../u/u.start.reporter.ts');
    const cell = await start.loadStartCell(args._[1]);
    const identity = start.resolveStartIdentity(cell.descriptor, input.pkg);
    const output = reporting.StartReporter.create(reporter.value, {
      header: (width) => start.formatStartHeader(identity, width),
    });

    try {
      output.open();
      const started = await start.startCell(cell, {
        mode: mode.value,
        onStarting: output.starting,
        onReady: output.ready,
      });
      const res = start.toStartResult(input, started, identity);
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
    return fail(input, Err.summary(error, { cause: true }));
  }
}
