import { Err, type t } from '../common.ts';
import { FmtHelp } from '../u.help/u.mod.ts';
import type { RunContext } from './u.context.ts';
import { fail, print } from './u.output.ts';

export async function runInit(ctx: RunContext): Promise<t.CellCli.Result> {
  const { args, input } = ctx;
  const initHelp = await FmtHelp.initOutput({ agent: args.agent });

  if (args.format !== undefined) {
    return fail(input, 'Unexpected option for init: --format', initHelp);
  }
  if (args.plan) return fail(input, 'Unexpected option for init: --plan', initHelp);
  if (args.force) return fail(input, 'Unexpected option for init: --force', initHelp);
  if (args.mode !== undefined) {
    return fail(input, 'Unexpected option for init: --mode', initHelp);
  }
  if (args.reporter !== undefined) {
    return fail(input, 'Unexpected option for init: --reporter', initHelp);
  }
  if (args.help) {
    print(initHelp);
    return { kind: 'help', input, text: initHelp };
  }
  if (args.agent) return fail(input, '--agent requires --help', initHelp);
  if (args._.length > 2) return fail(input, `Unexpected argument: ${args._[2]}`, initHelp);

  try {
    const { formatInitResult, initCell } = await import('../u/u.init.ts');
    const res = await initCell({ dir: args._[1] ?? '.', dryRun: args.dryRun });
    const text = formatInitResult(res);
    print(text);
    return {
      kind: 'init',
      input,
      text,
      target: res.target,
      dryRun: res.dryRun,
      ops: res.ops,
    };
  } catch (error) {
    return fail(input, Err.summary(error));
  }
}
