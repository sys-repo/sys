import { describe, expect, it } from '../../-test.ts';
import { stripAnsi } from '../common.ts';
import { CellCli } from '../mod.ts';
import { silent } from './u.fixture.ts';

describe(`@sys/cell/cli help`, () => {
  it('root help → routes to the root help surface', async () => {
    const res = await silent(() => CellCli.run({ argv: [] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/cell');
    ['dsl', 'info', 'init', 'migrate', 'task', 'start', 'kill'].forEach((command) => {
      expect(text).to.contain(command);
    });
  });

  it('command -h → routes to command help surfaces', async () => {
    const cases = ['info', 'init', 'migrate', 'task', 'start', 'kill'] as const;

    for (const command of cases) {
      const res = await silent(() => CellCli.run({ argv: [command, '-h'] }));
      const text = stripAnsi(res.text);

      expect(res.kind).to.eql('help');
      expect(text).to.contain(`@sys/cell ${command}`);
      expect(text).to.contain('-h, --help');
    }
  });

  it('start help → documents selectable reporter modes and the automatic default', async () => {
    const res = await silent(() => CellCli.run({ argv: ['start', '--help'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('--reporter <auto|screen|raw>');
    expect(text).to.contain('defaults to `auto`');
  });

  it('unknown commands fail with root help context', async () => {
    const help = await silent(() => CellCli.run({ argv: ['help', 'init'] }));
    const run = await silent(() => CellCli.run({ argv: ['run', '-h'] }));
    const text = stripAnsi(run.text);

    expect(help.kind).to.eql('error');
    if (help.kind !== 'error') throw new Error('expected error result');
    expect(help.code).to.eql(1);
    expect(stripAnsi(help.text)).to.contain('Unknown command: help');
    expect(run.kind).to.eql('error');
    if (run.kind !== 'error') throw new Error('expected error result');
    expect(run.code).to.eql(1);
    expect(text).to.contain('Unknown command: run');
    expect(text).to.contain('@sys/cell');
    expect(text).to.contain('@sys/cell migrate');
    expect(text).to.not.contain('@sys/cell run');
  });
});
