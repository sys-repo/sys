import { Err, type t } from '../common.ts';
import { FmtHelp } from '../u.help/u.mod.ts';
import { mergeFailures } from '../u.lifecycle/u.failure.ts';
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

  let interruptExit = false;
  try {
    const start = await import('../u.lifecycle/u.start.ts');
    const reporting = await import('../u.lifecycle/u.start.reporter.ts');
    const lifecycle = await import('../u.lifecycle/u.shutdown.ts');
    const cell = await start.loadStartCell(args._[1]);
    const identity = start.resolveStartIdentity(cell.descriptor, input.pkg);
    const shutdown = lifecycle.createShutdownSignal();

    try {
      let output: ReturnType<typeof reporting.StartReporter.create>;
      try {
        output = reporting.StartReporter.create(
          reporter.value,
          { header: (width) => start.formatStartHeader(identity, width) },
          {
            until: shutdown.done,
            onInterrupt() {
              shutdown.interrupt();
            },
            onFailure(cause) {
              return shutdown.failPresentation(cause);
            },
          },
        );
      } catch (cause) {
        try {
          shutdown.dispose();
        } catch (cleanup) {
          throw mergeFailures(cause, cleanup, 'Cell start setup failed and cleanup also failed.');
        }
        throw cause;
      }

      let outcome: RunStartOutcome;
      try {
        output.open();
        const started = await start.startCell(cell, {
          mode: mode.value,
          shutdown,
          onStarting: output.starting,
          onReady: output.ready,
        });
        const res = start.toStartResult(input, started, identity);
        output.complete(start.formatStartResult(started));
        outcome = { ok: true, value: res };
      } catch (cause) {
        outcome = { ok: false, cause };
      }

      try {
        await output.dispose();
      } catch (cause) {
        outcome = withCleanupFailure(
          outcome,
          cause,
          'Cell start failed while releasing terminal presentation.',
        );
      }
      try {
        shutdown.dispose();
      } catch (cause) {
        outcome = withCleanupFailure(
          outcome,
          cause,
          'Cell start failed while releasing shutdown ownership.',
        );
      }

      if (!outcome.ok) throw outcome.cause;
      return outcome.value;
    } finally {
      interruptExit = lifecycle.isInterruptShutdownReason(shutdown.reason);
      if (interruptExit) Deno.exitCode = 130;
    }
  } catch (error) {
    const result = fail(input, Err.summary(error, { cause: true }));
    return interruptExit ? { ...result, code: 130 } : result;
  }
}

type RunStartOutcome =
  | { readonly ok: true; readonly value: t.CellCli.Result }
  | { readonly ok: false; readonly cause: unknown };

function withCleanupFailure(
  outcome: RunStartOutcome,
  cleanup: unknown,
  message: string,
): RunStartOutcome {
  if (outcome.ok) return { ok: false, cause: cleanup };
  return { ok: false, cause: mergeFailures(outcome.cause, cleanup, message) };
}
