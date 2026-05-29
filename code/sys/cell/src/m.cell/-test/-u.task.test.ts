import { describe, expect, Fs, it, Str, type t } from '../../-test.ts';
import { Cell } from '../mod.ts';
import { createTaskMethod } from '../u/task.root.ts';
import { tempCell } from './u.fixture.ts';

describe('Cell.Task', () => {
  it('runs a leaf root task with structured config-ref args', async () => {
    resetEvents();
    const root = await tempCell(
      'task-run-leaf',
      descriptor([leaf('capture', { config: './-config/capture.yaml' })]),
    );
    await writeTask(root, './-tasks/capture.ts', taskSource('CaptureTask', 'capture'));
    await Fs.write(Fs.join(root, '-config/capture.yaml'), `value: from-config\n`, {
      force: true,
    });

    const cell = await Cell.load(root);
    const res = await Cell.Task.run(cell, 'capture');
    const event = events()[0];

    expect(res.task.name).to.eql('capture');
    expect(res.steps.length).to.eql(1);
    expect(res.steps[0].ok).to.eql(true);
    expect(res.steps[0].result).to.eql({
      name: 'capture',
      config: Fs.join(root, '-config/capture.yaml'),
    });
    expect(res.steps[0].metrics.run.resolvedAt).to.be.at.least(
      res.steps[0].metrics.run.startedAt,
    );
    expect(event.name).to.eql('capture');
    expect(event.args.cwd).to.eql(root);
    expect(event.args).to.not.have.property('config');
    expect(event.args.paths.config).to.eql(Fs.join(root, '-config/capture.yaml'));
  });

  it('root Cell.task delegates to task run', async () => {
    resetEvents();
    const root = await tempCell(
      'task-run-root-alias',
      descriptor([leaf('capture', { config: './-config/capture.yaml' })]),
    );
    await writeTask(root, './-tasks/capture.ts', taskSource('CaptureTask', 'capture'));
    await Fs.write(Fs.join(root, '-config/capture.yaml'), `value: from-config\n`, {
      force: true,
    });

    const cell = await Cell.load(root);
    const runEvents: t.Cell.Task.Run.Event[] = [];
    const res = await Cell.task(cell, 'capture', {
      onEvent: (event) => runEvents.push(event),
    });

    expect(res.task.name).to.eql('capture');
    expect(events().map((event) => event.name)).to.eql(['capture']);
    expect(runEventLabels(runEvents)).to.eql([
      'task:start:capture',
      'task:step:start:capture',
      'task:step:ok:capture',
      'task:ok:capture',
    ]);
  });

  it('root Cell.task can load a root path for one-shot task run', async () => {
    resetEvents();
    const root = await tempCell(
      'task-run-root-path-alias',
      descriptor([leaf('capture', { config: './-config/capture.yaml' })]),
    );
    await writeTask(root, './-tasks/capture.ts', taskSource('CaptureTask', 'capture'));
    await Fs.write(Fs.join(root, '-config/capture.yaml'), `value: from-config\n`, {
      force: true,
    });

    const res = await Cell.task(root, 'capture');
    const event = events()[0];

    expect(res.task.name).to.eql('capture');
    expect(event.name).to.eql('capture');
    expect(event.args.cwd).to.eql(root);
  });

  it('root Cell.task can load the default root when only the task name is given', async () => {
    const root = await tempCell(
      'task-run-default-root-alias',
      descriptor([leaf('capture', { config: './-config/capture.yaml' })]),
    );
    const cell = await Cell.load(root);
    const calls: string[] = [];
    const task = createTaskMethod({
      async load(root) {
        calls.push(root ?? '<default>');
        return cell;
      },
      async run(cell, name) {
        return { task: cell.descriptor.tasks?.[0] ?? { name, steps: [] }, steps: [] };
      },
    });

    const res = await task('capture');

    expect(calls).to.eql(['<default>']);
    expect(res.task.name).to.eql('capture');
  });

  it('runs composite tasks in referenced root-task order', async () => {
    resetEvents();
    const root = await tempCell(
      'task-run-composite',
      descriptor([
        leaf('pull:view', { use: 'PullTask', from: './-tasks/pull.ts' }, false),
        leaf('deploy:stage', { use: 'DeployTask', from: './-tasks/deploy.ts' }, false),
        composite('sample:deploy', ['pull:view', 'deploy:stage']),
      ]),
    );
    await writeTask(root, './-tasks/pull.ts', taskSource('PullTask', 'pull:view'));
    await writeTask(root, './-tasks/deploy.ts', taskSource('DeployTask', 'deploy:stage'));

    const runEvents: t.Cell.Task.Run.Event[] = [];
    const res = await Cell.Task.run(await Cell.load(root), 'sample:deploy', {
      onEvent: (event) => runEvents.push(event),
    });

    expect(events().map((event) => event.name)).to.eql(['pull:view', 'deploy:stage']);
    expect(runEventLabels(runEvents)).to.eql([
      'task:start:sample:deploy',
      'task:step:start:pull:view',
      'task:step:ok:pull:view',
      'task:step:start:deploy:stage',
      'task:step:ok:deploy:stage',
      'task:ok:sample:deploy',
    ]);
    expect(taskStartLeaves(runEvents)).to.eql(['pull:view', 'deploy:stage']);
    expect(res.task.name).to.eql('sample:deploy');
    expect(res.steps.map((step) => step.task.name)).to.eql(['pull:view', 'deploy:stage']);
    expect(res.steps.every((step) => step.ok)).to.eql(true);
    expect(res.steps.map((step) => step.result)).to.eql([
      { name: 'pull:view' },
      { name: 'deploy:stage' },
    ]);
  });

  it('passes configless leaf tasks without config or paths.config', async () => {
    resetEvents();
    const root = await tempCell(
      'task-run-configless',
      descriptor([leaf('clean:tmp', { use: 'CleanTask' }, false)]),
    );
    await writeTask(root, './-tasks/capture.ts', taskSource('CleanTask', 'clean:tmp'));

    await Cell.Task.run(await Cell.load(root), 'clean:tmp');
    const event = events()[0];

    expect(event.name).to.eql('clean:tmp');
    expect(event.args).to.not.have.property('config');
    expect(event.args.paths).to.eql({});
  });

  it('verifies and imports only the requested task closure', async () => {
    resetEvents();
    const root = await tempCell(
      'task-run-requested-closure-only',
      descriptor([
        leaf('capture', { config: './-config/capture.yaml' }),
        leaf('broken:unrelated', { from: './-tasks/missing.ts' }, false),
      ]),
    );
    await writeTask(root, './-tasks/capture.ts', taskSource('CaptureTask', 'capture'));
    await Fs.write(Fs.join(root, '-config/capture.yaml'), `value: from-config\n`, {
      force: true,
    });

    const res = await Cell.Task.run(await Cell.load(root), 'capture');

    expect(res.task.name).to.eql('capture');
    expect(events().map((event) => event.name)).to.eql(['capture']);
  });

  it('ignores observer errors while running successful tasks', async () => {
    resetEvents();
    const root = await tempCell(
      'task-run-observer-error-success',
      descriptor([leaf('capture', { config: './-config/capture.yaml' })]),
    );
    await writeTask(root, './-tasks/capture.ts', taskSource('CaptureTask', 'capture'));
    await Fs.write(Fs.join(root, '-config/capture.yaml'), `value: from-config\n`, {
      force: true,
    });

    const res = await Cell.Task.run(await Cell.load(root), 'capture', {
      onEvent: () => {
        throw new Error('observer boom');
      },
    });

    expect(res.task.name).to.eql('capture');
    expect(res.steps.map((step) => step.task.name)).to.eql(['capture']);
    expect(events().map((event) => event.name)).to.eql(['capture']);
  });

  it('preserves task failures when observers fail during failure telemetry', async () => {
    resetEvents();
    const root = await tempCell(
      'task-run-observer-error-failure',
      descriptor([leaf('fail', { use: 'FailTask', from: './-tasks/fail.ts' }, false)]),
    );
    await writeTask(root, './-tasks/fail.ts', failingTaskSource('FailTask', 'fail'));

    const error = await catchRun(await Cell.load(root), 'fail', {
      onEvent: () => {
        throw new Error('observer boom');
      },
    });

    expect(error?.message).to.eql("Cell.Task.run: failed task 'fail' while running 'fail'.");
    expect(events().map((event) => event.name)).to.eql(['fail']);
  });

  it('pre-verifies the requested task closure before executing any leaf', async () => {
    resetEvents();
    const root = await tempCell(
      'task-run-preflight-before-execute',
      descriptor([
        leaf('first', { use: 'FirstTask', from: './-tasks/first.ts' }, false),
        leaf('bad', { use: 'BadTask', from: './-tasks/bad.ts' }, false),
        composite('all', ['first', 'bad']),
      ]),
    );
    await writeTask(root, './-tasks/first.ts', taskSource('FirstTask', 'first'));
    await writeTask(root, './-tasks/bad.ts', `export const BadTask = {};\n`);

    const runEvents: t.Cell.Task.Run.Event[] = [];
    const error = await catchRun(await Cell.load(root), 'all', {
      onEvent: (event) => runEvents.push(event),
    });

    expect(error?.message).to.eql(
      "Cell.Task.verify: './-tasks/bad.ts' use 'BadTask' must expose run(...) for task 'bad'.",
    );
    expect(runEventLabels(runEvents)).to.eql(['task:start:all', 'task:fail:all']);
    expect(events()).to.eql([]);
  });

  it('stops on first failing referenced task', async () => {
    resetEvents();
    const root = await tempCell(
      'task-run-failing-composite',
      descriptor([
        leaf('first', { use: 'FirstTask', from: './-tasks/first.ts' }, false),
        leaf('fail', { use: 'FailTask', from: './-tasks/fail.ts' }, false),
        leaf('after', { use: 'AfterTask', from: './-tasks/after.ts' }, false),
        composite('all', ['first', 'fail', 'after']),
      ]),
    );
    await writeTask(root, './-tasks/first.ts', taskSource('FirstTask', 'first'));
    await writeTask(root, './-tasks/fail.ts', failingTaskSource('FailTask', 'fail'));
    await writeTask(root, './-tasks/after.ts', taskSource('AfterTask', 'after'));

    const runEvents: t.Cell.Task.Run.Event[] = [];
    const error = await catchRun(await Cell.load(root), 'all', {
      onEvent: (event) => runEvents.push(event),
    });

    expect(error?.message).to.eql("Cell.Task.run: failed task 'fail' while running 'all'.");
    expect(runEventLabels(runEvents)).to.eql([
      'task:start:all',
      'task:step:start:first',
      'task:step:ok:first',
      'task:step:start:fail',
      'task:step:fail:fail',
      'task:fail:all',
    ]);
    expect(events().map((event) => event.name)).to.eql(['first', 'fail']);
  });
});

/**
 * Helpers:
 */
type TaskEvent = {
  readonly name: string;
  readonly args: t.Cell.Task.RunArgs;
};

type TaskGlobal = typeof globalThis & { __cellTaskEvents?: TaskEvent[] };

async function catchRun(
  cell: t.Cell.Instance,
  name: t.Cell.Id,
  options?: t.Cell.Task.Run.Options,
): Promise<Error | undefined> {
  try {
    await Cell.Task.run(cell, name, options);
  } catch (err) {
    return err as Error;
  }
}

function runEventLabels(events: t.Cell.Task.Run.Event[]): string[] {
  return events.map((event) => {
    if (event.kind === 'task:start' || event.kind === 'task:ok' || event.kind === 'task:fail') {
      return `${event.kind}:${event.task.name}`;
    }
    return `${event.kind}:${event.step.name}`;
  });
}

function taskStartLeaves(events: t.Cell.Task.Run.Event[]): string[] {
  const event = events.find(isTaskStartEvent);
  return event?.leaves.map((leaf) => leaf.name) ?? [];
}

function isTaskStartEvent(
  event: t.Cell.Task.Run.Event,
): event is Extract<t.Cell.Task.Run.Event, { kind: 'task:start' }> {
  return event.kind === 'task:start';
}

function resetEvents() {
  (globalThis as TaskGlobal).__cellTaskEvents = [];
}

function events(): readonly TaskEvent[] {
  return (globalThis as TaskGlobal).__cellTaskEvents ?? [];
}

async function writeTask(root: string, path: string, source: string) {
  await Fs.write(Fs.join(root, path), source, { force: true });
}

function descriptor(tasks: string[]) {
  const header = Str.dedent(`
    kind: cell
    version: 1

    tasks:
  `).trimStart();
  return `${header}\n${Str.indent(tasks.join('\n'), 2)}\n`;
}

function leaf(
  name: string,
  overrides: Partial<t.Cell.Task.Leaf> = {},
  withConfig = true,
) {
  const task: t.Cell.Task.Leaf = {
    name,
    use: 'CaptureTask',
    from: './-tasks/capture.ts',
    ...overrides,
  };
  if (withConfig) task.config = overrides.config ?? './-config/capture.yaml';

  const source = Str.dedent(`
    - name: ${task.name}
      use: ${task.use}
      from: ${task.from}
  `).trimStart();
  return task.config ? `${source}\n  config: ${task.config}\n` : `${source}\n`;
}

function composite(name: string, tasks: string[]) {
  const source = Str.dedent(`
    - name: ${name}
      steps:
  `).trimStart();
  const steps = tasks.map((task) => `- task: ${task}`).join('\n');
  return `${source}\n${Str.indent(steps, 4)}\n`;
}

function taskSource(exportName: string, name: string) {
  return Str.dedent(`
    export const ${exportName} = {
      run(args: unknown) {
        const input = args as { paths: { config?: string } };
        const g = globalThis as unknown as { __cellTaskEvents?: unknown[] };
        g.__cellTaskEvents ??= [];
        g.__cellTaskEvents.push({ name: '${name}', args });
        return { name: '${name}', ...(input.paths.config ? { config: input.paths.config } : {}) };
      },
    };
  `).trimStart();
}

function failingTaskSource(exportName: string, name: string) {
  return Str.dedent(`
    export const ${exportName} = {
      run(args: unknown) {
        const g = globalThis as unknown as { __cellTaskEvents?: unknown[] };
        g.__cellTaskEvents ??= [];
        g.__cellTaskEvents.push({ name: '${name}', args });
        throw new Error('boom');
      },
    };
  `).trimStart();
}
