import { describe, expect, Fs, it, Str, Testing } from '../../-test.ts';
import { CellCli } from '../mod.ts';
import { Fmt } from '../u.fmt.ts';
import { stripAnsi } from '../common.ts';
import {
  failedStepText,
  fakeSpinner,
  okStepText,
  resetTaskEvents,
  runningStepText,
  runningTaskText,
  silent,
  type SpinnerLog,
  stepCompletionLabelWidth,
  taskCompositeDescriptor,
  taskEvents,
  taskLeafDescriptor,
  taskSource,
  taskStepResult,
} from './u.fixture.ts';

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

  it('task progress renderer → uses CLI spinner formatting for lifecycle events', () => {
    const log: SpinnerLog[] = [];
    const render = Fmt.Task.progressRenderer({ spinner: fakeSpinner(log), silent: false });
    const root = taskCompositeDescriptor('all', ['pull:view', 'deploy:stage']);
    const pull = taskLeafDescriptor('pull:view');
    const deploy = taskLeafDescriptor('deploy:stage');

    const pullResult = taskStepResult(pull, true, 120);
    const deployResult = taskStepResult(deploy, false, 16);
    const width = stepCompletionLabelWidth([pull, deploy]);

    render({ kind: 'task:start', task: root, leaves: [pull, deploy] });
    render({ kind: 'task:step:start', rootTask: root, step: pull });
    render({ kind: 'task:step:ok', rootTask: root, step: pull, result: pullResult });
    render({ kind: 'task:step:start', rootTask: root, step: deploy });
    render({
      kind: 'task:step:fail',
      rootTask: root,
      step: deploy,
      result: deployResult,
    });
    render({ kind: 'task:fail', task: root, error: new Error('boom'), steps: [] });

    expect(log).to.eql([
      { kind: 'start', text: runningTaskText('all') },
      { kind: 'text', text: runningStepText('pull:view') },
      { kind: 'succeed', text: okStepText('pull:view', '120ms', width) },
      { kind: 'start', text: runningStepText('deploy:stage') },
      { kind: 'fail', text: failedStepText('deploy:stage', '16ms', width) },
    ]);
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
    expect(text).to.contain(`root    ${fs.dir}`);
    expect(text).to.contain('task    all');
    expect(text).to.contain('steps   2');
    expect(text).to.contain('all');
    expect(text).to.contain('├─ capture');
    expect(text).to.contain('│  use  CaptureTask');
    expect(text).to.contain('│  from ./-tasks/capture.ts');
    expect(text).to.contain('│  config ./-config/capture.yaml');
    expect(text).to.contain('└─ clean');
    expect(text).to.contain('   use  CleanTask');
    expect(text).to.contain('   from ./-tasks/clean.ts');
    expect(text).to.not.contain('config -');
    expect(taskEvents()).to.eql([]);
  });
});
