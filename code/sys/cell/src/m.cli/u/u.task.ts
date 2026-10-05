import { Cell } from '../../m.cell/mod.ts';
import type { t } from '../common.ts';
import { Fmt } from '../u.fmt/u.mod.ts';

export type RunCellTaskArgs = {
  name: t.Cell.Id;
  dir?: string;
};

export type RunCellTaskResult = {
  readonly root: string;
  readonly task: t.Cell.Task.Descriptor;
  readonly steps: readonly t.Cell.Task.StepResult[];
};

export type PlanCellTaskResult = {
  readonly root: string;
  readonly plan: t.Cell.Task.Plan;
};

export async function planCellTask(args: RunCellTaskArgs): Promise<PlanCellTaskResult> {
  const cell = await Cell.load(args.dir);
  const plan = await Cell.Task.plan(cell, args.name);

  return { root: cell.root, plan };
}

export async function runCellTask(args: RunCellTaskArgs): Promise<RunCellTaskResult> {
  const cell = await Cell.load(args.dir);
  const res = await Cell.task(cell, args.name, {
    onEvent: Fmt.Task.progressRenderer(),
  });

  return {
    root: cell.root,
    task: res.task,
    steps: res.steps,
  };
}

export function formatTaskResult(res: RunCellTaskResult): string {
  return Fmt.Task.result(res);
}

export function formatTaskPlanResult(res: PlanCellTaskResult): string {
  return Fmt.Task.plan(res);
}

export function toTaskResult(
  input: t.CellCli.Input,
  res: RunCellTaskResult,
): t.CellCli.Task.RunResult {
  return {
    kind: 'task',
    input,
    text: formatTaskResult(res),
    root: res.root,
    task: res.task.name,
    steps: res.steps.length,
  };
}

export function toTaskPlanResult(
  input: t.CellCli.Input,
  res: PlanCellTaskResult,
): t.CellCli.Task.PlanResult {
  return {
    kind: 'task-plan',
    input,
    text: formatTaskPlanResult(res),
    root: res.root,
    task: res.plan.task.name,
    steps: res.plan.leaves.length,
  };
}
