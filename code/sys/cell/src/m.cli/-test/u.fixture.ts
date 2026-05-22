/**
 * Shared CLI test fixtures.
 */
import { Fs, Str, Time } from '../../-test.ts';
import { c, Cli, type t } from '../common.ts';

/** Suppress command presentation while preserving the returned CLI result. */
export async function silent<T>(fn: () => Promise<T>) {
  const info = console.info;
  console.info = () => undefined;

  try {
    return await fn();
  } finally {
    console.info = info;
  }
}

export type TaskEvent = {
  readonly args: {
    readonly cwd: string;
    readonly paths: { readonly config?: string };
  };
};

export type SpinnerLog = {
  readonly kind: 'start' | 'text' | 'succeed' | 'fail' | 'stop';
  readonly text: string;
};

type TaskGlobal = typeof globalThis & { __cellCliTaskEvents?: TaskEvent[] };

export function resetTaskEvents() {
  (globalThis as TaskGlobal).__cellCliTaskEvents = [];
}

export function taskEvents(): readonly TaskEvent[] {
  return (globalThis as TaskGlobal).__cellCliTaskEvents ?? [];
}

export function taskSource(exportName: string) {
  return Str.dedent(`
    export const ${exportName} = {
      run(args: unknown) {
        const g = globalThis as unknown as { __cellCliTaskEvents?: unknown[] };
        g.__cellCliTaskEvents ??= [];
        g.__cellCliTaskEvents.push({ args });
        return { ok: true };
      },
    };
  `).trimStart();
}

export function statusServiceSource() {
  return Str.dedent(`
    export const StatusService = {
      start() {
        const root = new URL('../view/', import.meta.url).pathname.replace(/\\/$/, '');
        return {
          finished: Promise.resolve('done'),
          close() {},
          status() {
            return {
              state: 'ready',
              name: 'owner-local-name',
              kind: 'fixture',
              root,
              urls: [
                { href: 'http://127.0.0.1:4321/', label: 'root' },
                { href: 'http://127.0.0.1:4321/view/', label: 'path' },
                { href: 'http://127.0.0.1:4321/payments/', label: 'route.payments' },
              ],
              details: [{ label: 'dist', value: 'dist/' }],
            };
          },
        };
      },
    };
  `).trimStart();
}

export function devServiceSource() {
  return Str.dedent(`
    export const DevService = {
      start() {
        return {
          finished: Promise.resolve('done'),
          close() {},
          status() {
            return { state: 'ready' };
          },
        };
      },
    };
  `).trimStart();
}

export function serviceUrlsOf(text: string): string[] {
  return text.match(/https?:\/\/\S+/g) ?? [];
}

export function runningTaskText(name: string): string {
  return `${Cli.Fmt.spinnerText('running task ', false)}${c.cyan(name)}`;
}

export function runningStepText(name: string): string {
  return `${Cli.Fmt.spinnerText('running ', false)}${c.cyan(name)}`;
}

export function okStepText(name: string, elapsed: string, width: number): string {
  return stepCompletionText('ok', name, elapsed, width);
}

export function failedStepText(name: string, elapsed: string, width: number): string {
  return stepCompletionText('failed', name, elapsed, width);
}

function stepCompletionText(
  status: 'ok' | 'failed',
  name: string,
  elapsed: string,
  width: number,
): string {
  const color = status === 'ok' ? c.green : c.yellow;
  const prefix = `${color(status)} ${c.gray('step')} ${c.white(name)}`;
  const labelWidth = stepCompletionLabel(status, name);
  const targetWidth = Math.max(width, labelWidth);
  const pad = ' '.repeat(targetWidth - labelWidth + 2);
  return Cli.Fmt.spinnerRaw(`${prefix}${pad}${c.gray(elapsed)}`, false);
}

export function stepCompletionLabelWidth(leaves: Iterable<t.Cell.Task.Leaf>): number {
  let width = 0;
  for (const leaf of leaves) {
    width = Math.max(
      width,
      stepCompletionLabel('ok', leaf.name),
      stepCompletionLabel('failed', leaf.name),
    );
  }
  return width;
}

function stepCompletionLabel(status: 'ok' | 'failed', name: string): number {
  return `${status} step ${name}`.length;
}

export function fakeSpinner(log: SpinnerLog[]): t.CliSpinner.Lib['start'] {
  return (text = '') => {
    log.push({ kind: 'start', text });
    let value = text;
    let spinner: t.CliSpinner.Instance;
    spinner = {
      get text() {
        return value;
      },
      set text(next: string) {
        value = next;
        log.push({ kind: 'text', text: next });
      },
      start(next = value) {
        value = next;
        log.push({ kind: 'start', text: next });
        return spinner;
      },
      stop() {
        log.push({ kind: 'stop', text: value });
        return spinner;
      },
      succeed(next = value) {
        value = next;
        log.push({ kind: 'succeed', text: next });
        return spinner;
      },
      fail(next = value) {
        value = next;
        log.push({ kind: 'fail', text: next });
        return spinner;
      },
    };
    return spinner;
  };
}

export function taskLeafDescriptor(name: string): t.Cell.Task.Leaf {
  return { name, use: 'Task', from: './-tasks/task.ts' };
}

export function taskCompositeDescriptor(
  name: string,
  tasks: string[],
): t.Cell.Task.Composite {
  return { name, steps: tasks.map((task) => ({ task })) };
}

export function taskStepResult(
  task: t.Cell.Task.Leaf,
  ok = true,
  elapsed = 0,
): t.Cell.Task.StepResult {
  const startedAt = Time.now.timestamp;
  const resolvedAt = startedAt + elapsed;
  const metrics: t.Cell.Task.RunMetrics = { run: { startedAt, resolvedAt } };
  if (ok) return { task, ok: true, result: { ok: true }, metrics };
  return { task, ok: false, error: new Error('boom'), metrics };
}

export async function read(path: string) {
  const res = await Fs.readText(path);
  if (!res.ok) throw res.error;
  return res.data ?? '';
}
