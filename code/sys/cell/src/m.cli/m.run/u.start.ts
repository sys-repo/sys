import { isServiceMode } from '../../m.cell/u.services/u.plan.ts';
import { Err, Is, type t } from '../common.ts';
import { FmtHelp } from '../u.help/u.mod.ts';
import type { RunContext } from './u.context.ts';
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
  if (args.agent || args.dryRun || args.plan) {
    const flag = args.agent ? '--agent' : args.dryRun ? '--dry-run' : '--plan';
    return fail({ argv }, `Unexpected option for start: ${flag}`, startHelp);
  }

  const mode = startMode(args.mode);
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

/**
 * Helpers:
 */
type StartModeResult =
  | { readonly ok: true; readonly value?: t.Cell.Services.ServiceMode }
  | { readonly ok: false; readonly message: string };

function startMode(value: t.CellCli.ParsedArgs['mode']): StartModeResult {
  if (value === undefined) return { ok: true };
  if (Is.array<string | boolean>(value)) {
    return { ok: false, message: 'Repeated option for start: --mode' };
  }
  if (!Is.str(value) || value.length === 0) {
    return { ok: false, message: 'Option requires a value: --mode' };
  }
  if (!isServiceMode(value)) {
    return { ok: false, message: `Invalid start mode: '${value}'` };
  }
  return { ok: true, value };
}
