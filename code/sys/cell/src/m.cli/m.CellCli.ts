import { c, Err, Is, Str, type t } from './common.ts';
import { parseArgs } from './u.args.ts';
import { FmtHelp } from './u.help.ts';

/**
 * Cell operator CLI.
 */
export const CellCli: t.CellCli.Lib = {
  async run(input = {}) {
    const argv = [...(input.argv ?? [])];
    const args = parseArgs(argv);
    const command = args._[0];

    const help = await FmtHelp.output();

    if (args.unknown.length > 0) {
      return fail({ argv }, `Unknown option: ${args.unknown.join(', ')}`, help);
    }

    if (!command && args.format !== undefined) {
      return fail({ argv }, 'Unexpected option without command: --format', help);
    }

    if ((!command && args.agent) || (!command && args.dryRun) || (!command && args.plan)) {
      const flag = args.agent ? '--agent' : args.dryRun ? '--dry-run' : '--plan';
      return fail({ argv }, `Unexpected option without command: ${flag}`, help);
    }

    if ((!command && args.help) || argv.length === 0) {
      print(help);
      return { kind: 'help', input: { argv }, text: help };
    }

    if (!command) return fail({ argv }, 'Missing command.', help);

    if (command === 'init') {
      const initHelp = await FmtHelp.initOutput({ agent: args.agent });
      if (args.format !== undefined) {
        return fail({ argv }, 'Unexpected option for init: --format', initHelp);
      }
      if (args.plan) return fail({ argv }, 'Unexpected option for init: --plan', initHelp);
      if (args.help) {
        print(initHelp);
        return { kind: 'help', input: { argv }, text: initHelp };
      }
      if (args.agent) return fail({ argv }, '--agent requires --help', initHelp);
      if (args._.length > 2) return fail({ argv }, `Unexpected argument: ${args._[2]}`, initHelp);

      try {
        const { formatInitResult, initCell } = await import('./u.init.ts');
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

    if (command === 'dsl') {
      const path = args._.slice(1).map(String);
      const rootHelp = async () => await FmtHelp.dslOutput();
      const format = dslFormat(args.format);

      if (!format.ok) return fail({ argv }, format.message, await rootHelp());

      if (args.agent || args.dryRun || args.plan) {
        const flag = args.agent ? '--agent' : args.dryRun ? '--dry-run' : '--plan';
        return fail({ argv }, `Unexpected option for dsl: ${flag}`, await rootHelp());
      }

      try {
        const text = await FmtHelp.dslOutput({ path, format: format.value });
        print(text);
        return { kind: 'help', input: { argv }, text };
      } catch (error) {
        return fail({ argv }, Err.summary(error), await rootHelp());
      }
    }

    if (command === 'task') {
      const taskHelp = await FmtHelp.taskOutput();
      if (args.format !== undefined) {
        return fail({ argv }, 'Unexpected option for task: --format', taskHelp);
      }
      if (args.help) {
        print(taskHelp);
        return { kind: 'help', input: { argv }, text: taskHelp };
      }
      if (args.agent || args.dryRun) {
        const flag = args.agent ? '--agent' : '--dry-run';
        return fail({ argv }, `Unexpected option for task: ${flag}`, taskHelp);
      }
      if (args._.length < 2) return fail({ argv }, 'Missing task name.', taskHelp);
      if (args._.length > 3) return fail({ argv }, `Unexpected argument: ${args._[3]}`, taskHelp);

      try {
        const { planCellTask, runCellTask, toTaskPlanResult, toTaskResult } = await import(
          './u.task.ts'
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

    if (command === 'start') {
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
      if (args._.length > 2) return fail({ argv }, `Unexpected argument: ${args._[2]}`, startHelp);

      try {
        const { startCell, toStartResult } = await import('./u.start.ts');
        const res = toStartResult({ argv }, await startCell({ dir: args._[1] }));
        print(res.text);
        return res;
      } catch (error) {
        return fail({ argv }, Err.summary(error));
      }
    }

    return fail({ argv }, `Unknown command: ${command}`, help);
  },
};

/**
 * Helpers:
 */
type DslFormatResult =
  | { readonly ok: true; readonly value: t.CellCli.Dsl.Format }
  | { readonly ok: false; readonly message: string };

function dslFormat(value: t.CellCli.ParsedArgs['format']): DslFormatResult {
  if (value === undefined) return { ok: true, value: 'human' };
  if (Is.array<string | boolean>(value)) {
    return { ok: false, message: 'Repeated option for dsl: --format' };
  }
  if (!Is.str(value)) return { ok: false, message: 'Option requires a value: --format' };
  if (value === 'human' || value === 'skill') return { ok: true, value };
  return { ok: false, message: `Unsupported dsl format: ${value} (expected: human, skill)` };
}

function print(text: string) {
  console.info(text);
}

function fail(input: t.CellCli.Input, message: string, help?: string): t.CellCli.Error {
  const warning = c.yellow(`⚠ ${message}`);
  const text = help ? `${warning}\n\n${Str.trimEdgeNewlines(help)}` : warning;
  print(text);
  return { kind: 'error', input, text, code: 1 };
}
