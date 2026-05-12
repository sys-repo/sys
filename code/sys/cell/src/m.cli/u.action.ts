import { Cell } from '../m.cell/mod.ts';
import { c, CliTable, Str, type t } from './common.ts';

export type RunCellActionArgs = {
  readonly name: t.Cell.Id;
  readonly dir?: string;
};

export type RunCellActionResult = {
  readonly root: string;
  readonly action: t.Cell.Action.Descriptor;
  readonly steps: readonly t.Cell.Action.StepResult[];
};

export async function runCellAction(args: RunCellActionArgs): Promise<RunCellActionResult> {
  const cell = await Cell.load(args.dir ?? '.');
  const res = await Cell.Action.run(cell, args.name);

  return {
    root: cell.root,
    action: res.action,
    steps: res.steps,
  };
}

export function formatActionResult(res: RunCellActionResult): string {
  const table = CliTable.create([]);
  table.push([c.gray('root'), c.white(res.root)]);
  table.push([c.gray('action'), c.white(res.action.name)]);
  table.push([c.gray('steps'), c.white(String(res.steps.length))]);
  res.steps.forEach((step) => {
    table.push([c.gray(step.ok ? 'ok' : 'failed'), c.white(step.action.name)]);
  });
  return Str.trimEdgeNewlines(String(table));
}

export function toActionResult(
  input: t.CellCli.Input,
  res: RunCellActionResult,
): t.CellCli.Action.Result {
  return {
    kind: 'action',
    input,
    text: formatActionResult(res),
    root: res.root,
    action: res.action.name,
    steps: res.steps.length,
  };
}
