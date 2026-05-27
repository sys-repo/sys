import { Err, type t } from '../common.ts';
import { FmtHelp } from '../u.help/u.mod.ts';
import type { RunContext } from './u.context.ts';
import { fail, print } from './u.output.ts';

export async function runInit(ctx: RunContext): Promise<t.CellCli.Result> {
  const { args, argv } = ctx;
  const initHelp = await FmtHelp.initOutput({ agent: args.agent });

  if (args.format !== undefined) {
    return fail({ argv }, 'Unexpected option for init: --format', initHelp);
  }
  if (args.plan) return fail({ argv }, 'Unexpected option for init: --plan', initHelp);
  if (args.mode !== undefined) {
    return fail({ argv }, 'Unexpected option for init: --mode', initHelp);
  }
  if (args.help) {
    print(initHelp);
    return { kind: 'help', input: { argv }, text: initHelp };
  }
  if (args.agent) return fail({ argv }, '--agent requires --help', initHelp);
  if (args._.length > 2) return fail({ argv }, `Unexpected argument: ${args._[2]}`, initHelp);

  try {
    const { formatInitResult, initCell } = await import('../u/u.init.ts');
    const res = await initCell({ dir: args._[1] ?? '.', dryRun: args.dryRun });
    const text = formatInitResult(res);
    print(text);
    return {
      kind: 'init',
      input: { argv },
      text,
      target: res.target,
      dryRun: res.dryRun,
      ops: res.ops,
    };
  } catch (error) {
    return fail({ argv }, Err.summary(error));
  }
}
