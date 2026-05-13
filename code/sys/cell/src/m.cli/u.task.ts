import { Cell } from '../m.cell/mod.ts';
import { c, CliTable, Str, type t } from './common.ts';

export type RunCellTaskArgs = {
  readonly name: t.Cell.Id;
  readonly dir?: string;
};

export type RunCellTaskResult = {
  readonly root: string;
  readonly task: t.Cell.Task.Descriptor;
  readonly steps: readonly t.Cell.Task.StepResult[];
};

export async function runCellTask(args: RunCellTaskArgs): Promise<RunCellTaskResult> {
  const cell = await Cell.load(args.dir);
  const res = await Cell.task(cell, args.name);

  return {
    root: cell.root,
    task: res.task,
    steps: res.steps,
  };
}

export function formatTaskResult(res: RunCellTaskResult): string {
  const table = CliTable.create([]);
  table.push([c.gray('root'), c.white(res.root)]);
  table.push([c.gray('task'), c.white(res.task.name)]);
  table.push([c.gray('steps'), c.white(String(res.steps.length))]);
  res.steps.forEach((step) => {
    table.push([c.gray(step.ok ? 'ok' : 'failed'), c.white(step.task.name)]);
  });
  return Str.trimEdgeNewlines(String(table));
}

export function toTaskResult(
  input: t.CellCli.Input,
  res: RunCellTaskResult,
): t.CellCli.Task.Result {
  return {
    kind: 'task',
    input,
    text: formatTaskResult(res),
    root: res.root,
    task: res.task.name,
    steps: res.steps.length,
  };
}
