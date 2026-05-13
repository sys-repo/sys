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

export function formatTaskPlanResult(res: PlanCellTaskResult): string {
  const { plan } = res;
  const table = CliTable.create([]);
  table.push([c.gray('root'), c.white(res.root)]);
  table.push([c.gray('task'), c.white(plan.task.name)]);
  table.push([c.gray('steps'), c.white(String(plan.leaves.length))]);

  return Str.trimEdgeNewlines([
    String(table),
    renderPlanTree(plan.tree),
  ].join('\n\n'));
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

/**
 * Helpers:
 */
function renderPlanTree(node: t.Cell.Task.PlanNode): string {
  return renderPlanNode(node, { prefix: '', last: true, root: true }).join('\n');
}

function renderPlanNode(
  node: t.Cell.Task.PlanNode,
  options: { readonly prefix: string; readonly last: boolean; readonly root: boolean },
): string[] {
  const branch = options.root ? '' : options.last ? '└─ ' : '├─ ';
  const lines = [`${options.prefix}${branch}${node.task.name}`];
  const childPrefix = options.root ? '' : `${options.prefix}${options.last ? '   ' : '│  '}`;

  if (node.kind === 'leaf') {
    lines.push(...renderLeafDetails(node, childPrefix));
    return lines;
  }

  node.steps.forEach((step, index) => {
    lines.push(
      ...renderPlanNode(step, {
        prefix: childPrefix,
        last: index === node.steps.length - 1,
        root: false,
      }),
    );
  });
  return lines;
}

function renderLeafDetails(
  leaf: t.Cell.Task.PlanLeaf,
  prefix: string,
): string[] {
  const lines = [
    `${prefix}from ${leaf.endpoint.from}`,
    `${prefix}use  ${leaf.endpoint.use}`,
  ];

  if (leaf.task.config) lines.push(`${prefix}config ${leaf.task.config}`);
  return lines;
}
