import { c, Cli, CliTable, Fs, Str, type t } from './common.ts';

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

export const Fmt = {
  Task: {
    result(res: TaskResult): string {
      const table = CliTable.create([]);
      table.push([c.gray('root'), rootPath(res.root)]);
      table.push([c.gray('task'), c.white(res.task.name)]);
      table.push([c.gray('steps'), c.white(String(res.steps.length))]);
      return `\n${Str.trimEdgeNewlines(String(table))}\n`;
    },

    plan(res: TaskPlanResult): string {
      const { plan } = res;
      const table = CliTable.create([]);
      table.push([c.gray('root'), rootPath(res.root)]);
      table.push([c.gray('task'), c.white(plan.task.name)]);
      table.push([c.gray('steps'), c.white(String(plan.leaves.length))]);

      return Str.trimEdgeNewlines([
        String(table),
        renderPlanTree(plan.tree),
      ].join('\n\n'));
    },

    progressRenderer(deps: TaskProgressRendererDeps = {}): t.Cell.Task.Run.EventHandler {
      const startSpinner = deps.spinner ?? Cli.spinner;
      const silent = deps.silent ?? !isTerminal();
      let spinner: TaskProgressSpinner | undefined;

      const start = (name: string) => {
        if (silent) return;
        if (spinner) {
          spinner.text = runningText(name);
          return;
        }
        spinner = startSpinner(runningText(name));
      };
      const succeed = (name: string) => {
        if (!spinner) return;
        spinner.succeed(okText(name));
        spinner = undefined;
      };
      const fail = (name: string) => {
        if (!spinner) return;
        spinner.fail(failedText(name));
        spinner = undefined;
      };

      return (event) => {
        if (event.kind === 'task:start') return start(event.task.name);
        if (event.kind === 'task:step:start') return start(event.step.name);
        if (event.kind === 'task:step:ok') return succeed(event.step.name);
        if (event.kind === 'task:step:fail') return fail(event.step.name);
        if (event.kind === 'task:ok') return succeed(event.task.name);
        if (event.kind === 'task:fail') return fail(event.task.name);
      };
    },
  },
} as const;

/**
 * Helpers:
 */
function rootPath(path: string): string {
  return c.gray(Cli.Fmt.path(Fs.trimCwd(path), Cli.Fmt.Path.fmt()));
}

function runningText(name: string): string {
  return `${Cli.Fmt.spinnerText('running task ', false)}${c.cyan(name)}`;
}

function okText(name: string): string {
  return Cli.Fmt.spinnerRaw(`${c.green('ok')} ${c.white(name)}`, false);
}

function failedText(name: string): string {
  return Cli.Fmt.spinnerRaw(`${c.yellow('failed')} ${c.white(name)}`, false);
}

function isTerminal(): boolean {
  return Deno.stdout.isTerminal();
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
