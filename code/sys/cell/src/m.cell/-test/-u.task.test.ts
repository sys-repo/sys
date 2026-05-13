import { describe, expect, Fs, it, Str, type t } from '../../-test.ts';
import { Cell } from '../mod.ts';
import { createTaskMethod } from '../u.task.root.ts';
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
    const res = await Cell.task(cell, 'capture');

    expect(res.task.name).to.eql('capture');
    expect(events().map((event) => event.name)).to.eql(['capture']);
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
        leaf('pull:view', { from: './-tasks/pull.ts', use: 'PullTask' }, false),
        leaf('deploy:stage', { from: './-tasks/deploy.ts', use: 'DeployTask' }, false),
        composite('sample:deploy', ['pull:view', 'deploy:stage']),
      ]),
    );
    await writeTask(root, './-tasks/pull.ts', taskSource('PullTask', 'pull:view'));
    await writeTask(root, './-tasks/deploy.ts', taskSource('DeployTask', 'deploy:stage'));

    const res = await Cell.Task.run(await Cell.load(root), 'sample:deploy');

    expect(events().map((event) => event.name)).to.eql(['pull:view', 'deploy:stage']);
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

  it('pre-verifies the requested task closure before executing any leaf', async () => {
    resetEvents();
    const root = await tempCell(
      'task-run-preflight-before-execute',
      descriptor([
        leaf('first', { from: './-tasks/first.ts', use: 'FirstTask' }, false),
        leaf('bad', { from: './-tasks/bad.ts', use: 'BadTask' }, false),
        composite('all', ['first', 'bad']),
      ]),
    );
    await writeTask(root, './-tasks/first.ts', taskSource('FirstTask', 'first'));
    await writeTask(root, './-tasks/bad.ts', `export const BadTask = {};\n`);

    const error = await catchRun(await Cell.load(root), 'all');

    expect(error?.message).to.eql(
      "Cell.Task.verify: './-tasks/bad.ts' use 'BadTask' must expose run(...) for task 'bad'.",
    );
    expect(events()).to.eql([]);
  });

  it('stops on first failing referenced task', async () => {
    resetEvents();
    const root = await tempCell(
      'task-run-failing-composite',
      descriptor([
        leaf('first', { from: './-tasks/first.ts', use: 'FirstTask' }, false),
        leaf('fail', { from: './-tasks/fail.ts', use: 'FailTask' }, false),
        leaf('after', { from: './-tasks/after.ts', use: 'AfterTask' }, false),
        composite('all', ['first', 'fail', 'after']),
      ]),
    );
    await writeTask(root, './-tasks/first.ts', taskSource('FirstTask', 'first'));
    await writeTask(root, './-tasks/fail.ts', failingTaskSource('FailTask', 'fail'));
    await writeTask(root, './-tasks/after.ts', taskSource('AfterTask', 'after'));

    const error = await catchRun(await Cell.load(root), 'all');

    expect(error?.message).to.eql("Cell.Task.run: failed task 'fail' while running 'all'.");
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
  cell: Awaited<ReturnType<typeof Cell.load>>,
  name: t.Cell.Id,
): Promise<Error | undefined> {
  try {
    await Cell.Task.run(cell, name);
  } catch (err) {
    return err as Error;
  }
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

function descriptor(tasks: readonly string[]) {
  return `kind: cell\nversion: 1\n\ntasks:\n${tasks.join('\n')}\n`;
}

function leaf(
  name: string,
  overrides: Partial<t.Cell.Task.Leaf> = {},
  withConfig = true,
) {
  const task: t.Cell.Task.Leaf = {
    name,
    from: './-tasks/capture.ts',
    use: 'CaptureTask',
    ...overrides,
  };
  if (withConfig) task.config = overrides.config ?? './-config/capture.yaml';

  return [
    `  - name: ${task.name}`,
    `    from: ${task.from}`,
    `    use: ${task.use}`,
    ...(task.config ? [`    config: ${task.config}`] : []),
  ].join('\n');
}

function composite(name: string, tasks: readonly string[]) {
  return [
    `  - name: ${name}`,
    `    steps:`,
    ...tasks.map((task) => `      - task: ${task}`),
  ].join('\n');
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
