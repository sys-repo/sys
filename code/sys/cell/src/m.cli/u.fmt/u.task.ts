import { c, Cli, Fs, Str, type t, Time } from '../common.ts';
import { elapsedSuffix } from './u.elapsed.ts';
import { FmtFields } from './u.fields.ts';
import { FmtFit } from './u.fit.ts';

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
    return `\n${Str.trimEdgeNewlines(renderSummary({
      root: res.root,
      task: res.task.name,
      steps: res.steps.length,
    }))}\n`;
  },

  plan(res: TaskPlanResult): string {
    const { plan } = res;
    return `\n${Str.trimEdgeNewlines([
      FmtFields.title('Tasks'),
      renderSummary({ root: res.root, task: plan.task.name, steps: plan.leaves.length }),
      renderPlanTree(plan.tree),
    ].join('\n\n'))}\n`;
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

type SummaryInput = {
  readonly root: string;
  readonly task: string;
  readonly steps: number;
};

type PlanNodeRenderOptions = {
  readonly prefix: string;
  readonly last: boolean;
  readonly root: boolean;
};

type DetailRow = {
  readonly label: 'use' | 'from' | 'config';
  readonly value: string;
  readonly kind?: 'path';
};

const SUMMARY_LABEL_WIDTH = FmtFields.labelWidth(['root', 'task', 'steps']);
const DETAIL_LABEL_WIDTH = FmtFields.labelWidth(['use', 'from', 'config']);
const SUMMARY_GAP = '   ';
const DETAIL_GAP = '  ';

function renderSummary(input: SummaryInput): string {
  return [
    summaryRow('root', displayRoot(input.root), 'path'),
    summaryRow('task', input.task),
    summaryRow('steps', String(input.steps)),
  ].join('\n');
}

function summaryRow(label: string, value: string, kind?: 'path'): string {
  const linePrefix = FmtFields.indent(1);
  const displayLabel = FmtFields.label(label, SUMMARY_LABEL_WIDTH);
  const reserve = linePrefix.length + SUMMARY_LABEL_WIDTH + SUMMARY_GAP.length;
  const displayValue = kind === 'path'
    ? FmtFit.path(value, reserve)
    : FmtFit.value(value, reserve, { color: c.white });
  return `${linePrefix}${displayLabel}${SUMMARY_GAP}${displayValue}`;
}

function renderPlanTree(node: t.Cell.Task.PlanNode): string {
  return renderPlanNode(node, { prefix: FmtFields.indent(1), last: true, root: true }).join('\n');
}

function renderPlanNode(
  node: t.Cell.Task.PlanNode,
  options: PlanNodeRenderOptions,
): string[] {
  const branch = options.root
    ? ''
    : options.last
    ? `${Cli.Fmt.Tree.last}${Cli.Fmt.Tree.bar} `
    : `${Cli.Fmt.Tree.mid}${Cli.Fmt.Tree.bar} `;
  const prefix = `${options.prefix}${branch}`;
  const lines = [treeNameLine(prefix, node.task.name)];
  const childPrefix = options.root
    ? options.prefix
    : `${options.prefix}${options.last ? '   ' : `${Cli.Fmt.Tree.vert}  `}`;

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

function treeNameLine(prefix: string, name: string): string {
  return `${treeText(prefix)}${FmtFit.value(name, prefix.length, { color: c.white })}`;
}

function renderLeafDetails(
  leaf: t.Cell.Task.PlanLeaf,
  prefix: string,
): string[] {
  const rows: DetailRow[] = [
    { label: 'use', value: leaf.endpoint.use },
    {
      label: 'from',
      value: leaf.endpoint.from,
      kind: pathish(leaf.endpoint.from) ? 'path' : undefined,
    },
  ];

  if (leaf.task.config) rows.push({ label: 'config', value: leaf.task.config, kind: 'path' });
  return rows.map((row) => detailLine(prefix, row));
}

function detailLine(prefix: string, row: DetailRow): string {
  const label = FmtFields.label(row.label, DETAIL_LABEL_WIDTH);
  const reserve = prefix.length + DETAIL_LABEL_WIDTH + DETAIL_GAP.length;
  const value = row.kind === 'path'
    ? FmtFit.path(row.value, reserve)
    : FmtFit.value(row.value, reserve, { color: c.gray });
  return `${treeText(prefix)}${label}${DETAIL_GAP}${value}`;
}

function treeText(value: string): string {
  return c.dim(c.gray(value));
}

function displayRoot(root: string): string {
  const trimmed = Fs.trimCwd(root, { prefix: true });
  if (!trimmed || trimmed === './') return '.';
  return trimmed;
}

function pathish(value: string): boolean {
  return value.startsWith('.') || value.startsWith('/');
}
