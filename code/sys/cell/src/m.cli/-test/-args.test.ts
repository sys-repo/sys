import { describe, expect, it } from '../../-test.ts';
import { stripAnsi } from '../common.ts';
import { CellCli } from '../mod.ts';
import { silent } from './u.fixture.ts';

describe(`@sys/cell/cli args`, () => {
  it('--format is scoped to dsl only', async () => {
    const root = stripAnsi((await silent(() => CellCli.run({ argv: ['--format', 'skill'] }))).text);
    const init = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['init', '--format', 'skill'] }))).text,
    );
    const task = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['task', '--format', 'skill'] }))).text,
    );
    const start = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['start', '--format', 'skill'] }))).text,
    );

    expect(root).to.contain('Unexpected option without command: --format');
    expect(root).to.contain('@sys/cell');
    expect(init).to.contain('Unexpected option for init: --format');
    expect(init).to.contain('@sys/cell init');
    expect(task).to.contain('Unexpected option for task: --format');
    expect(task).to.contain('@sys/cell task');
    expect(start).to.contain('Unexpected option for start: --format');
    expect(start).to.contain('@sys/cell start');
  });

  it('task → rejects missing names, unsupported options, and extra args', async () => {
    const missing = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['task'] }))).text,
    );
    const help = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['task', '--dry-run'] }))).text,
    );
    const extra = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['task', 'capture', '.', 'extra'] }))).text,
    );

    expect(missing).to.contain('Missing task name.');
    expect(missing).to.contain('@sys/cell task');
    expect(help).to.contain('Unexpected option for task: --dry-run');
    expect(help).to.contain('@sys/cell task');
    expect(extra).to.contain('Unexpected argument: extra');
    expect(extra).to.contain('@sys/cell task');
  });

  it('--plan is scoped to task only', async () => {
    const root = stripAnsi((await silent(() => CellCli.run({ argv: ['--plan'] }))).text);
    const init = stripAnsi((await silent(() => CellCli.run({ argv: ['init', '--plan'] }))).text);
    const dsl = stripAnsi((await silent(() => CellCli.run({ argv: ['dsl', '--plan'] }))).text);
    const start = stripAnsi((await silent(() => CellCli.run({ argv: ['start', '--plan'] }))).text);

    expect(root).to.contain('Unexpected option without command: --plan');
    expect(init).to.contain('Unexpected option for init: --plan');
    expect(dsl).to.contain('Unexpected option for dsl: --plan');
    expect(start).to.contain('Unexpected option for start: --plan');
  });

  it('--mode is scoped to start only', async () => {
    const root = stripAnsi((await silent(() => CellCli.run({ argv: ['--mode', 'dev'] }))).text);
    const init = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['init', '--mode', 'dev'] }))).text,
    );
    const dsl = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['dsl', '--mode', 'dev'] }))).text,
    );
    const task = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['task', 'capture', '--mode', 'dev'] }))).text,
    );

    expect(root).to.contain('Unexpected option without command: --mode');
    expect(init).to.contain('Unexpected option for init: --mode');
    expect(dsl).to.contain('Unexpected option for dsl: --mode');
    expect(task).to.contain('Unexpected option for task: --mode');
  });

  it('start → rejects unsupported command options and extra args', async () => {
    const help = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['start', '--dry-run'] }))).text,
    );
    const missingMode = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['start', '--mode'] }))).text,
    );
    const repeatedMode = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['start', '--mode', 'dev', '--mode', 'prod'] })))
        .text,
    );
    const invalidMode = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['start', '--mode', 'Bad'] }))).text,
    );
    const extra = stripAnsi(
      (await silent(() => CellCli.run({ argv: ['start', '.', 'extra'] }))).text,
    );

    expect(help).to.contain('Unexpected option for start: --dry-run');
    expect(help).to.contain('@sys/cell start');
    expect(missingMode).to.contain('Option requires a value: --mode');
    expect(missingMode).to.contain('@sys/cell start');
    expect(repeatedMode).to.contain('Repeated option for start: --mode');
    expect(repeatedMode).to.contain('@sys/cell start');
    expect(invalidMode).to.contain("Invalid start mode: 'Bad'");
    expect(invalidMode).to.contain('@sys/cell start');
    expect(extra).to.contain('Unexpected argument: extra');
    expect(extra).to.contain('@sys/cell start');
  });
});
