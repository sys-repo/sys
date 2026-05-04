import { Err, type t } from './common.ts';
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

    if ((!command && args.agent) || (!command && args.dryRun)) {
      const flag = args.agent ? '--agent' : '--dry-run';
      return fail({ argv }, `Unexpected option without command: ${flag}`, help);
    }

    if ((!command && args.help) || argv.length === 0) {
      print(help);
      return { kind: 'help', input: { argv }, text: help };
    }

    if (!command) return fail({ argv }, 'Missing command.', help);

    if (command === 'init') {
      const initHelp = await FmtHelp.initOutput({ agent: args.agent });
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
      const text = await FmtHelp.dslOutput();
      if (args._.length > 1) return fail({ argv }, `Unexpected argument: ${args._[1]}`, text);
      if (args.agent || args.dryRun) {
        const flag = args.agent ? '--agent' : '--dry-run';
        return fail({ argv }, `Unexpected option for dsl: ${flag}`, text);
      }
      print(text);
      return { kind: 'help', input: { argv }, text };
    }

    return fail({ argv }, `Unknown command: ${command}`, help);
  },
};

function print(text: string) {
  console.info(text);
  console.info();
}

function fail(input: t.CellCli.Input, message: string, help?: string): t.CellCli.Error {
  const text = help ? `${message}\n\n${help}` : message;
  print(text);
  return { kind: 'error', input, text, code: 1 };
}
