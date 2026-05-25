import { describe, expect, Fs, it, Str, Testing } from '../../-test.ts';
import { CellCli } from '../mod.ts';
import { stripAnsi } from '../common.ts';
import {
  resetTaskEvents,
  silent,
  taskEvents,
  taskSource,
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
});
