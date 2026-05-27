import { Err, type t } from '../common.ts';
import { FmtHelp } from '../u.help/u.mod.ts';
import type { RunContext } from './u.context.ts';
import { fail, print } from './u.output.ts';

export async function runTask(ctx: RunContext): Promise<t.CellCli.Result> {
  const { args, argv } = ctx;
  const taskHelp = await FmtHelp.taskOutput();

  if (args.format !== undefined) {
    return fail({ argv }, 'Unexpected option for task: --format', taskHelp);
  }
  if (args.help) {
    print(taskHelp);
    return { kind: 'help', input: { argv }, text: taskHelp };
  }
  if (args.agent || args.dryRun || args.mode !== undefined) {
    const flag = args.agent ? '--agent' : args.dryRun ? '--dry-run' : '--mode';
    return fail({ argv }, `Unexpected option for task: ${flag}`, taskHelp);
  }
  if (args._.length < 2) return fail({ argv }, 'Missing task name.', taskHelp);
  if (args._.length > 3) return fail({ argv }, `Unexpected argument: ${args._[3]}`, taskHelp);

  try {
    const { planCellTask, runCellTask, toTaskPlanResult, toTaskResult } = await import(
      '../u/u.task.ts'
    );
    const res = args.plan
      ? toTaskPlanResult(
        { argv },
        await planCellTask({ name: args._[1], dir: args._[2] }),
      )
      : toTaskResult(
        { argv },
        await runCellTask({ name: args._[1], dir: args._[2] }),
      );
    print(res.text);
    return res;
  } catch (error) {
    return fail({ argv }, Err.summary(error));
  }
}
