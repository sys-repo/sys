import { c, Cli, CliTable, Str, type t, Time } from '../common.ts';
import { elapsedSuffix } from './u.elapsed.ts';
import { FmtPath } from './u.path.ts';

type TaskResult = {
  root: string;
  task: t.Cell.Task.Descriptor;
  steps: readonly t.Cell.Task.StepResult[];
};

type TaskPlanResult = {
  root: string;
  plan: t.Cell.Task.Plan;
};

type TaskProgressRendererDeps = {
  spinner?: t.CliSpinner.Lib['start'];
  silent?: boolean;
};

type TaskProgressSpinner = t.CliSpinner.Instance;
type TaskProgressTimer = ReturnType<typeof globalThis.setInterval>;

export const FmtTask = {
  result(res: TaskResult): string {
    const table = CliTable.create([]);
    table.push([c.gray('root'), FmtPath.display(res.root)]);
    table.push([c.gray('task'), c.white(res.task.name)]);
    table.push([c.gray('steps'), c.white(String(res.steps.length))]);
    return `\n${Str.trimEdgeNewlines(String(table))}\n`;
  },

  plan(res: TaskPlanResult): string {
    const { plan } = res;
    const table = CliTable.create([]);
    table.push([c.gray('root'), FmtPath.display(res.root)]);
    table.push([c.gray('task'), c.white(plan.task.name)]);
    table.push([c.gray('steps'), c.white(String(plan.leaves.length))]);

    return Str.trimEdgeNewlines([
      String(table),
      renderPlanTree(plan.tree),
    ].join('\n\n'));
  },

  progressRenderer(deps: TaskProgressRendererDeps = {}): t.Cell.Task.Run.EventHandler {
    const startSpinner = deps.spinner ?? Cli.spinner;
    const silent = deps.silent ?? !Cli.Is.terminal('stdout');
    let spinner: TaskProgressSpinner | undefined;
    let timer: TaskProgressTimer | undefined;
    let completionLabelWidth = 0;

    const stopTimer = () => {
      if (timer === undefined) return;
      globalThis.clearInterval(timer);
      timer = undefined;
    };
    const start = (render: () => string) => {
      if (silent) return;
      stopTimer();
      const text = render();
      if (spinner) {
        spinner.text = text;
      } else {
        spinner = startSpinner(text);
      }
      timer = globalThis.setInterval(() => {
        if (spinner) spinner.text = render();
      }, 1000);
    };
    const succeedStep = (result: t.Cell.Task.StepResult) => {
      stopTimer();
      if (!spinner) return;
      spinner.succeed(okStepText(result, completionLabelWidth));
      spinner = undefined;
    };
    const failStep = (result: t.Cell.Task.StepResult) => {
      stopTimer();
      if (!spinner) return;
      spinner.fail(failedStepText(result, completionLabelWidth));
      spinner = undefined;
    };
    const succeedTask = (name: string) => {
      stopTimer();
      if (!spinner) return;
      spinner.succeed(okTaskText(name));
      spinner = undefined;
    };
    const failTask = (name: string) => {
      stopTimer();
      if (!spinner) return;
      spinner.fail(failedTaskText(name));
      spinner = undefined;
    };

    return (event) => {
      if (event.kind === 'task:start') {
        completionLabelWidth = stepCompletionLabelWidth(event.leaves);
        const startedAt = Time.now.timestamp;
        return start(() => runningTaskText(event.task.name, startedAt));
      }
      if (event.kind === 'task:step:start') {
        const startedAt = Time.now.timestamp;
        return start(() => runningStepText(event.step.name, startedAt));
      }
      if (event.kind === 'task:step:ok') return succeedStep(event.result);
      if (event.kind === 'task:step:fail') return failStep(event.result);
      if (event.kind === 'task:ok') return succeedTask(event.task.name);
      if (event.kind === 'task:fail') return failTask(event.task.name);
    };
  },
} as const;

/**
 * Helpers:
 */
function runningTaskText(name: string, startedAt?: t.UnixTimestamp): string {
  const elapsed = elapsedSuffix({ startedAt });
  return `${Cli.Fmt.spinnerText('running task ', false)}${c.cyan(name)}${elapsed}`;
}

function runningStepText(name: string, startedAt?: t.UnixTimestamp): string {
  const elapsed = elapsedSuffix({ startedAt });
  return `${Cli.Fmt.spinnerText('running ', false)}${c.cyan(name)}${elapsed}`;
}

function okTaskText(name: string): string {
  return Cli.Fmt.spinnerRaw(`${c.green('ok')} ${c.white(name)}`, false);
}

function failedTaskText(name: string): string {
  return Cli.Fmt.spinnerRaw(`${c.yellow('failed')} ${c.white(name)}`, false);
}

function okStepText(result: t.Cell.Task.StepResult, width: number): string {
  return stepCompletionText('ok', result, width);
}

function failedStepText(result: t.Cell.Task.StepResult, width: number): string {
  return stepCompletionText('failed', result, width);
}

function stepCompletionText(
  status: 'ok' | 'failed',
  result: t.Cell.Task.StepResult,
  width: number,
): string {
  const color = status === 'ok' ? c.green : c.yellow;
  const name = result.task.name;
  const prefix = `${color(status)} ${c.gray('step')} ${c.white(name)}`;
  const elapsed = c.gray(elapsedText(result.metrics.run));
  const labelWidth = stepCompletionLabel(status, name).length;
  const targetWidth = Math.max(width, labelWidth);
  const pad = ' '.repeat(targetWidth - labelWidth + 2);

  return Cli.Fmt.spinnerRaw(`${prefix}${pad}${elapsed}`, false);
}

function stepCompletionLabelWidth(leaves: Iterable<t.Cell.Task.Leaf>): number {
  let width = 0;
  for (const leaf of leaves) {
    width = Math.max(
      width,
      stepCompletionLabel('ok', leaf.name).length,
      stepCompletionLabel('failed', leaf.name).length,
    );
  }
  return width;
}

function stepCompletionLabel(status: 'ok' | 'failed', name: string): string {
  return `${status} step ${name}`;
}

function elapsedText(metric: t.Cell.Task.RunMetrics['run']): string {
  return Time.elapsed(metric.startedAt, metric.resolvedAt).toString();
}

function renderPlanTree(node: t.Cell.Task.PlanNode): string {
  return renderPlanNode(node, { prefix: '', last: true, root: true }).join('\n');
}

function renderPlanNode(
  node: t.Cell.Task.PlanNode,
  options: { prefix: string; last: boolean; root: boolean },
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
    `${prefix}use  ${leaf.endpoint.use}`,
    `${prefix}from ${leaf.endpoint.from}`,
  ];

  if (leaf.task.config) lines.push(`${prefix}config ${leaf.task.config}`);
  return lines;
}
