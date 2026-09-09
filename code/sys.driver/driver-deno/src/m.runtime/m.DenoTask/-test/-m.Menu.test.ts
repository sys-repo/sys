import { describe, expect, it } from '../../../-test.ts';
import { DenoTask } from '../mod.ts';
import { captureInfo, testProject } from './u.fixture.ts';

describe('DenoTask.Menu.main', () => {
  it('--help renders usage and matching tasks without prompting', async () => {
    const fs = await testProject({
      'sample:alpha': 'deno --version',
      dev: 'deno --version',
    });

    const { result, text, exitCode } = await captureInfo(() => {
      return DenoTask.Menu.main({
        cwd: fs.dir,
        argv: ['--help'],
        title: '@sys/test samples',
        include: ['sample:*'],
      });
    });

    expect(result.kind).to.eql('help');
    expect(text).to.contain('Usage:');
    expect(text).to.contain('@sys/test samples');
    expect(text).to.contain('sample:alpha');
    expect(text).to.not.contain('dev');
    expect(exitCode).to.eql(0);
  });

  it('--list renders matching tasks without prompting', async () => {
    const fs = await testProject({
      'sample:alpha': 'deno --version',
      dev: 'deno --version',
    });

    const { result, text, exitCode } = await captureInfo(() => {
      return DenoTask.Menu.main({
        cwd: fs.dir,
        argv: ['--', '--list'],
        title: '@sys/test samples',
        include: ['sample:*'],
      });
    });

    expect(result.kind).to.eql('list');
    expect(text).to.contain('@sys/test samples');
    expect(text).to.contain('sample:alpha');
    expect(text).to.not.contain('dev');
    expect(exitCode).to.eql(0);
  });

  it('--non-interactive fails clearly without a task selection', async () => {
    const fs = await testProject({ 'sample:alpha': 'deno --version' });

    const { result, text, exitCode } = await captureInfo(() => {
      return DenoTask.Menu.main({
        cwd: fs.dir,
        argv: ['--non-interactive'],
        title: '@sys/test samples',
        include: ['sample:*'],
      });
    });

    expect(result.kind).to.eql('error');
    expect(text).to.contain('Missing task name in non-interactive mode.');
    expect(exitCode).to.eql(1);
  });

  it('positional task selection fails outside the filtered set', async () => {
    const fs = await testProject({
      'sample:alpha': 'deno --version',
      dev: 'deno --version',
    });

    const { result, text, exitCode } = await captureInfo(() => {
      return DenoTask.Menu.main({
        cwd: fs.dir,
        argv: ['dev'],
        title: '@sys/test samples',
        include: ['sample:*'],
      });
    });

    expect(result.kind).to.eql('error');
    expect(text).to.contain('Task is not included in this menu: dev');
    expect(exitCode).to.eql(1);
  });

  it('positional task selection runs a matching task and propagates child exit code', async () => {
    const fs = await testProject({
      'sample:fail': 'deno eval "Deno.exit(7)"',
    });

    const { result, exitCode } = await captureInfo(() => {
      return DenoTask.Menu.main({
        cwd: fs.dir,
        argv: ['sample:fail'],
        title: '@sys/test samples',
        include: ['sample:*'],
      });
    });

    expect(result.kind).to.eql('selected');
    if (result.kind === 'selected') expect(result.run.output.code).to.eql(7);
    expect(exitCode).to.eql(7);
  });
});
