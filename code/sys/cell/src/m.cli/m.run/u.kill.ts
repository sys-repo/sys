import { Err, type t } from '../common.ts';
import { FmtHelp } from '../u.help/u.mod.ts';
import type { RunContext } from './u.context.ts';
import { serviceModeFlag } from './u.mode.ts';
import { fail, print } from './u.output.ts';

export async function runKill(ctx: RunContext): Promise<t.CellCli.Result> {
  const { args, input } = ctx;
  const killHelp = await FmtHelp.killOutput();

  if (args.format !== undefined) {
    return fail(input, 'Unexpected option for kill: --format', killHelp);
  }
  if (args.agent) return fail(input, 'Unexpected option for kill: --agent', killHelp);
  if (args.plan) return fail(input, 'Unexpected option for kill: --plan', killHelp);
  if (args.reporter !== undefined) {
    return fail(input, 'Unexpected option for kill: --reporter', killHelp);
  }
  if (args.help) {
    print(killHelp);
    return { kind: 'help', input, text: killHelp };
  }

  const mode = serviceModeFlag(args.mode, 'kill');
  if (!mode.ok) return fail(input, mode.message, killHelp);
  if (args._.length > 2) return fail(input, `Unexpected argument: ${args._[2]}`, killHelp);

  try {
    const { killCell, toKillResult } = await import('../u/u.kill.ts');
    const res = toKillResult(
      input,
      await killCell({
        dir: args._[1],
        mode: mode.value,
        dryRun: args.dryRun,
        force: args.force,
      }),
    );
    print(res.text);
    return res;
  } catch (error) {
    return fail(input, Err.summary(error), killHelp);
  }
}
