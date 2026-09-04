import { c, Err, Is, Str, type t } from './common.ts';
import { parseArgs } from './u.args.ts';
import { FmtHelp } from './u.help.ts';

/**
 * Server package help/DSL CLI.
 */
export const ServerCli: t.ServerCli.Lib = Object.freeze({
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

    if ((!command && args.help) || argv.length === 0) {
      print(help);
      return { kind: 'help', input: { argv }, text: help };
    }

    if (!command) return fail({ argv }, 'Missing command.', help);

    if (command === 'dsl') {
      const path = args._.slice(1).map(String);
      const rootHelp = async () => await FmtHelp.dslOutput();
      const format = dslFormat(args.format);

      if (!format.ok) return fail({ argv }, format.message, await rootHelp());

      try {
        const text = await FmtHelp.dslOutput({ path, format: format.value });
        print(text);
        return { kind: 'help', input: { argv }, text };
      } catch (error) {
        return fail({ argv }, Err.summary(error), await rootHelp());
      }
    }

    return fail({ argv }, `Unknown command: ${command}`, help);
  },
});

/**
 * Helpers:
 */
type DslFormatResult =
  | { readonly ok: true; readonly value: t.ServerCli.Dsl.Format }
  | { readonly ok: false; readonly message: string };

function dslFormat(value: t.ServerCli.ParsedArgs['format']): DslFormatResult {
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

function fail(input: t.ServerCli.Input, message: string, help?: string): t.ServerCli.Error {
  const warning = c.yellow(`⚠ ${message}`);
  const text = help ? `${warning}\n\n${Str.trimEdgeNewlines(help)}` : warning;
  print(text);
  return { kind: 'error', input, text, code: 1 };
}
