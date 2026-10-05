import { describe, expect, Fs, it, Str, Testing } from '../../-test.ts';
import { CellCli } from '../mod.ts';
import { c, stripAnsi, type t } from '../common.ts';
import { Fmt } from '../u.fmt/u.mod.ts';
import { planWith } from '../u.fmt/u.task.ts';
import { resetTaskEvents, silent, taskEvents, taskSource } from './u.fixture.ts';

describe(`@sys/cell/cli task`, () => {
  it('task → runs a named finite task', async () => {
    resetTaskEvents();
    const fs = await Testing.dir('CellCli.task.run');
    await Fs.write(
      Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'),
      Str.dedent(`
        kind: cell
        version: 1

        tasks:
          - name: capture
            use: CaptureTask
            from: ./-tasks/capture.ts
            config: ./-config/capture.yaml
      `).trimStart(),
    );
    await Fs.write(Fs.join(fs.dir, '-config/capture.yaml'), `value: from-config\n`);
    await Fs.write(Fs.join(fs.dir, '-tasks/capture.ts'), taskSource('CaptureTask'));

    const res = await silent(() => CellCli.run({ argv: ['task', 'capture', fs.dir] }));
    const event = taskEvents()[0];

    expect(res.kind).to.eql('task');
    if (res.kind !== 'task') throw new Error('expected task result');
    expect(res.root).to.eql(fs.dir);
    expect(res.task).to.eql('capture');
    expect(res.steps).to.eql(1);
    expect(event.args.cwd).to.eql(fs.dir);
    expect(event.args).to.not.have.property('config');
    expect(event.args.paths.config).to.eql(Fs.join(fs.dir, '-config/capture.yaml'));
  });

  it('task --plan → prints a task closure without importing endpoints', async () => {
    resetTaskEvents();
    const fs = await Testing.dir('CellCli.task.plan');
    await Fs.write(
      Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'),
      Str.dedent(`
        kind: cell
        version: 1

        tasks:
          - name: capture
            use: CaptureTask
            from: ./-tasks/capture.ts
            config: ./-config/capture.yaml
          - name: clean
            use: CleanTask
            from: ./-tasks/clean.ts
          - name: all
            steps:
              - task: capture
              - task: clean
      `).trimStart(),
    );
    await Fs.write(Fs.join(fs.dir, '-tasks/capture.ts'), taskSource('CaptureTask'));
    await Fs.write(Fs.join(fs.dir, '-tasks/clean.ts'), taskSource('CleanTask'));

    const res = await silent(() => CellCli.run({ argv: ['task', 'all', fs.dir, '--plan'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('task-plan');
    if (res.kind !== 'task-plan') throw new Error('expected task plan result');
    expect(res.root).to.eql(fs.dir);
    expect(res.task).to.eql('all');
    expect(res.steps).to.eql(2);
    expect(text).to.contain('capture');
    expect(text).to.contain('CaptureTask');
    expect(text).to.contain('./-tasks/capture.ts');
    expect(text).to.contain('./-config/capture.yaml');
    expect(text).to.contain('clean');
    expect(text).to.contain('CleanTask');
    expect(text).to.contain('./-tasks/clean.ts');
    expect(taskEvents()).to.eql([]);
  });

  it('task --plan formatter → renders a titled indented task tree', () => {
    const rendered = Fmt.Task.plan(taskPlanFixture());
    const text = stripAnsi(rendered);

    expect(rendered).to.contain(c.green('Tasks'));
    expect(text).to.contain('Tasks');
    expect(text).to.contain('  root');
    expect(text).to.contain('  task');
    expect(text).to.contain('  steps');
    expect(text).to.contain('  workflow:deploy');
    expect(text).to.contain('  ├─ sample:deploy');
    expect(text).to.contain('  │  ├─ pull:view');
    expect(text).to.contain('  │  │  use     PullViewTask');
    expect(text).to.contain('  │  │  from    ./-scripts/deploy.ts');
    expect(text).to.contain('  │  │  config  ./-config/@sys.tools.pull/view.yaml');
    expect(text).to.contain('  │  └─ deploy:stage');
    expect(text).to.contain('  └─ validate:output');
  });

  it('task --plan formatter → fits summary and tree values to narrow terminals', () => {
    const rendered = planWith(
      { terminal: true, width: 46 },
      taskPlanFixture({
        root: '/sample/workspace/cell.deploy/with/a/very/long/root',
        use: 'VeryLongDeployStageTaskNameThatShouldCollapse',
        from: './-scripts/deploy/with/a/very/long/module/path.ts',
        config: './-config/@sys.tools.deploy/stage/with/a/very/long/config.yaml',
      }),
    );
    const text = stripAnsi(rendered);

    expect(rendered).to.contain(c.dim(c.gray('…')));
    expect(rendered).not.to.contain(c.cyan('…'));
    for (const line of text.split('\n').filter(Boolean)) expect(line.length <= 46).to.eql(true);
  });
});

function taskPlanFixture(options: {
  readonly root?: string;
  readonly use?: string;
  readonly from?: string;
  readonly config?: string;
} = {}): { root: string; plan: t.Cell.Task.Plan } {
  const root = options.root ?? '/sample/workspace/cell.deploy';
  const pull = leaf(
    'pull:view',
    'PullViewTask',
    './-scripts/deploy.ts',
    './-config/@sys.tools.pull/view.yaml',
  );
  const stage = leaf(
    'deploy:stage',
    options.use ?? 'DeployStageTask',
    options.from ?? './-scripts/deploy.ts',
    options.config ?? './-config/@sys.tools.deploy/stage.yaml',
  );
  const validate = leaf('validate:output', 'ValidateOutputTask', './-scripts/validate.ts');
  const deploy: t.Cell.Task.PlanComposite = {
    kind: 'composite',
    task: {
      name: 'sample:deploy' as t.Cell.Id,
      steps: [{ task: 'pull:view' as t.Cell.Id }, { task: 'deploy:stage' as t.Cell.Id }],
    },
    steps: [pull, stage],
  };
  const tree: t.Cell.Task.PlanComposite = {
    kind: 'composite',
    task: {
      name: 'workflow:deploy' as t.Cell.Id,
      steps: [{ task: 'sample:deploy' as t.Cell.Id }, { task: 'validate:output' as t.Cell.Id }],
    },
    steps: [deploy, validate],
  };

  return {
    root,
    plan: {
      root: root as t.StringDir,
      task: tree.task,
      tree,
      leaves: [pull, stage, validate],
    },
  };
}

function leaf(
  name: string,
  use: string,
  from: string,
  config?: string,
): t.Cell.Task.PlanLeaf {
  return {
    kind: 'leaf',
    task: {
      name: name as t.Cell.Id,
      use,
      from,
      ...(config ? { config: config as t.Cell.Path } : {}),
    },
    paths: config ? { config: config as t.StringPath } : {},
    endpoint: { use, from, specifier: from, source: 'local' },
  };
}
