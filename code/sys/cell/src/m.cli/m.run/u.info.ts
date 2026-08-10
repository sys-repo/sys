import { Cell } from '../../m.cell/mod.ts';
import { Err, Path, Str, type t } from '../common.ts';
import { FmtHelp } from '../u.help/u.mod.ts';
import { Fmt } from '../u.fmt/u.mod.ts';
import type { RunContext } from './u.context.ts';
import { fail, print } from './u.output.ts';

export async function runInfo(ctx: RunContext): Promise<t.CellCli.Result> {
  const { args, input } = ctx;
  const infoHelp = await FmtHelp.infoOutput();

  const unsupported = unsupportedFlag(args);
  if (unsupported) return fail(input, `Unexpected option for info: ${unsupported}`, infoHelp);
  if (args.help) {
    print(infoHelp);
    return { kind: 'help', input, text: infoHelp };
  }
  if (args._.length > 2) return fail(input, `Unexpected argument: ${args._[2]}`, infoHelp);

  try {
    const cell = await Cell.load(args._[1] ?? '.');
    const report = toReport(cell);
    const text = Fmt.Info.cell(report);

    print(text);
    return {
      kind: 'info',
      input,
      text,
      root: report.root,
      descriptor: report.descriptor,
      version: report.version,
      ...(report.name === undefined ? {} : { name: report.name }),
      services: report.services.length,
      tasks: report.tasks.length,
      report,
    };
  } catch (error) {
    return fail(input, Err.summary(error));
  }
}

/**
 * Helpers:
 */
function unsupportedFlag(args: t.CellCli.ParsedArgs): string | undefined {
  if (args.format !== undefined) return '--format';
  if (args.agent) return '--agent';
  if (args.dryRun) return '--dry-run';
  if (args.plan) return '--plan';
  if (args.force) return '--force';
  if (args.mode !== undefined) return '--mode';
  if (args.reporter !== undefined) return '--reporter';
}

function toReport(cell: t.Cell.Instance): t.CellCli.Info.Report {
  const descriptor = Str.trimLeadingDotSlash(Path.relative(cell.root, cell.paths.descriptor));
  return {
    root: cell.root,
    descriptor,
    descriptorPath: cell.paths.descriptor,
    version: cell.descriptor.version,
    ...(cell.descriptor.name === undefined ? {} : { name: cell.descriptor.name }),
    services: cell.descriptor.services ?? [],
    tasks: cell.descriptor.tasks ?? [],
  };
}
