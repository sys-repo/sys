import { Err, Is, type t } from '../common.ts';
import { FmtHelp } from '../u.help/u.mod.ts';
import type { RunContext } from './u.context.ts';
import { fail, print } from './u.output.ts';

export async function runDsl(ctx: RunContext): Promise<t.CellCli.Result> {
  const { args, argv } = ctx;
  const path = args._.slice(1).map(String);
  const rootHelp = async () => await FmtHelp.dslOutput();
  const format = dslFormat(args.format);

  if (!format.ok) return fail({ argv }, format.message, await rootHelp());

  if (args.agent || args.dryRun || args.plan || args.mode !== undefined) {
    const flag = args.agent
      ? '--agent'
      : args.dryRun
      ? '--dry-run'
      : args.plan
      ? '--plan'
      : '--mode';
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
